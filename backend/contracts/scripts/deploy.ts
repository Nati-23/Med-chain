import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

/**
 * Deployment script for PrescriptionRegistry contract on Base
 * Supports both Base Sepolia (testnet) and Base Mainnet
 */

async function main() {
  const network = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  
  console.log("========================================");
  console.log("MedChain Ethiopia - Contract Deployment");
  console.log("========================================");
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  
  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.001")) {
    console.warn("WARNING: Low balance. Deployment may fail.");
  }
  
  // Deploy contract
  console.log("\nDeploying PrescriptionRegistry...");
  
  const PrescriptionRegistry = await ethers.getContractFactory(
    "PrescriptionRegistry"
  );
  
  const contract = await PrescriptionRegistry.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  
  console.log("\n✅ Deployment successful!");
  console.log(`Contract address: ${contractAddress}`);
  console.log(`Transaction hash: ${contract.deploymentTransaction()?.hash}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress,
    deployerAddress: deployer.address,
    deploymentHash: contract.deploymentTransaction()?.hash,
    timestamp: new Date().toISOString(),
  };
  
  const deploymentPath = join(__dirname, "..", "deployments");
  const fs = await import("fs");
  
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const fileName = `deployment-${network.name}-${Date.now()}.json`;
  writeFileSync(
    join(deploymentPath, fileName),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Also update .env file in parent directory
  const envPath = join(__dirname, "..", "..", ".env");
  
  try {
    let envContent = "";
    try {
      envContent = fs.readFileSync(envPath, "utf8");
    } catch {
      // File doesn't exist, start fresh
    }
    
    // Update or add CONTRACT_ADDRESS
    if (envContent.includes("CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("\n📝 Updated .env file with contract address");
  } catch (error) {
    console.log("\n⚠️ Could not update .env file automatically");
    console.log(`   Add this to your .env: CONTRACT_ADDRESS=${contractAddress}`);
  }
  
  // Verify on Basescan (mainnet only)
  if (network.chainId === 8453) {
    console.log("\n🔍 To verify on Basescan, run:");
    console.log(`   npx hardhat verify --network baseMainnet ${contractAddress}`);
  } else if (network.chainId === 84532) {
    console.log("\n🔍 To verify on Basescan Sepolia, run:");
    console.log(`   npx hardhat verify --network baseSepolia ${contractAddress}`);
  }
  
  console.log("\n========================================");
  console.log("Deployment complete!");
  console.log("========================================");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
