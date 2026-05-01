
import { expect } from "chai";
import { ethers } from "hardhat";
import { PrescriptionRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("PrescriptionRegistry", function () {
  let contract: PrescriptionRegistry;
  let admin: HardhatEthersSigner;
  let doctor: HardhatEthersSigner;
  let pharmacist: HardhatEthersSigner;
  let patient: HardhatEthersSigner;

  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("sample_prescription"));
  const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("sample_prescription_2"));

  beforeEach(async function () {
    [admin, doctor, pharmacist, patient] = await ethers.getSigners();
    
    const PrescriptionRegistry = await ethers.getContractFactory("PrescriptionRegistry");
    contract = await PrescriptionRegistry.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await contract.admin()).to.equal(admin.address);
    });

    it("Should start with zero prescriptions", async function () {
      expect(await contract.totalPrescriptions()).to.equal(0);
    });
  });

  describe("Authorization", function () {
    it("Should authorize issuer", async function () {
      await contract.authorizeIssuer(doctor.address);
      expect(await contract.isAuthorized(doctor.address)).to.be.true;
    });

    it("Should only allow admin to authorize", async function () {
      await expect(
        contract.connect(doctor).authorizeIssuer(pharmacist.address)
      ).to.be.revertedWith("Only admin");
    });

    it("Should revoke issuer", async function () {
      await contract.authorizeIssuer(doctor.address);
      await contract.revokeIssuer(doctor.address);
      expect(await contract.isAuthorized(doctor.address)).to.be.false;
    });

    it("Should emit IssuerAuthorized event", async function () {
      await expect(contract.authorizeIssuer(doctor.address))
        .to.emit(contract, "IssuerAuthorized")
        .withArgs(doctor.address);
    });
  });

  describe("Prescription Creation", function () {
    beforeEach(async function () {
      await contract.authorizeIssuer(doctor.address);
    });

    it("Should create prescription", async function () {
      await contract.connect(doctor).createPrescription(sampleHash);
      
      const [status, timestamp, creator] = await contract.verifyPrescription(sampleHash);
      expect(status).to.equal(1); // Active
      expect(creator).to.equal(doctor.address);
      expect(timestamp).to.be.greaterThan(0);
    });

    it("Should prevent duplicate hashes", async function () {
      await contract.connect(doctor).createPrescription(sampleHash);
      
      await expect(
        contract.connect(doctor).createPrescription(sampleHash)
      ).to.be.revertedWith("Hash exists");
    });

    it("Should prevent unauthorized creation", async function () {
      await expect(
        contract.connect(patient).createPrescription(sampleHash)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should emit PrescriptionCreated event", async function () {
      const tx = await contract.connect(doctor).createPrescription(sampleHash);
      const block = await ethers.provider.getBlock("latest");
      
      await expect(tx)
        .to.emit(contract, "PrescriptionCreated")
        .withArgs(sampleHash, doctor.address, block?.timestamp);
    });

    it("Should batch create prescriptions", async function () {
      const hashes = [sampleHash, sampleHash2];
      await contract.connect(doctor).batchCreatePrescriptions(hashes);
      
      expect(await contract.prescriptionExists(sampleHash)).to.be.true;
      expect(await contract.prescriptionExists(sampleHash2)).to.be.true;
    });

    it("Should reject empty batch", async function () {
      await expect(
        contract.connect(doctor).batchCreatePrescriptions([])
      ).to.be.revertedWith("Empty batch");
    });
it("Should reject oversized batch", async function () {
      const hashes = Array(51).fill(sampleHash);
      await expect(
        contract.connect(doctor).batchCreatePrescriptions(hashes)
      ).to.be.revertedWith("Batch too large");
    });
  });

  describe("Prescription Usage", function () {
    beforeEach(async function () {
      await contract.authorizeIssuer(doctor.address);
      await contract.connect(doctor).createPrescription(sampleHash);
    });

    it("Should mark prescription as used", async function () {
      await contract.connect(pharmacist).markAsUsed(sampleHash);
      
      const [status] = await contract.verifyPrescription(sampleHash);
      expect(status).to.equal(2); // Used
    });

    it("Should prevent double dispensing", async function () {
      await contract.connect(pharmacist).markAsUsed(sampleHash);
      
      await expect(
        contract.connect(pharmacist).markAsUsed(sampleHash)
      ).to.be.revertedWith("Already used");
    });

    it("Should emit PrescriptionUsed event", async function () {
      await expect(contract.connect(pharmacist).markAsUsed(sampleHash))
        .to.emit(contract, "PrescriptionUsed")
        .withArgs(sampleHash, pharmacist.address, await getTimestamp());
    });

    it("Should not allow marking non-existent prescription", async function () {
      await expect(
        contract.connect(pharmacist).markAsUsed(sampleHash2)
      ).to.be.revertedWith("Not found");
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      await contract.authorizeIssuer(doctor.address);
      await contract.connect(doctor).createPrescription(sampleHash);
    });

    it("Should return correct status for active prescription", async function () {
      const [status, timestamp, creator] = await contract.verifyPrescription(sampleHash);
      expect(status).to.equal(1); // Active
      expect(creator).to.equal(doctor.address);
    });

    it("Should return status 0 for non-existent prescription", async function () {
      const [status, timestamp, creator] = await contract.verifyPrescription(sampleHash2);
      expect(status).to.equal(0); // Not found
      expect(timestamp).to.equal(0);
      expect(creator).to.equal(ethers.ZeroAddress);
    });

    it("Should return status 2 for used prescription", async function () {
      await contract.connect(pharmacist).markAsUsed(sampleHash);
      const [status] = await contract.verifyPrescription(sampleHash);
      expect(status).to.equal(2); // Used
    });

    it("Should correctly check prescription existence", async function () {
      expect(await contract.prescriptionExists(sampleHash)).to.be.true;
      expect(await contract.prescriptionExists(sampleHash2)).to.be.false;
    });

    it("Should correctly check if prescription is used", async function () {
      expect(await contract.isPrescriptionUsed(sampleHash)).to.be.false;
      await contract.connect(pharmacist).markAsUsed(sampleHash);
      expect(await contract.isPrescriptionUsed(sampleHash)).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("Should transfer admin rights", async function () {
      await contract.transferAdmin(doctor.address);
      expect(await contract.admin()).to.equal(doctor.address);
    });

    it("Should emit AdminTransferred event", async function () {
      await expect(contract.transferAdmin(doctor.address))
        .to.emit(contract, "AdminTransferred")
        .withArgs(doctor.address);
    });

    it("Should prevent zero address transfer", async function () {
      await expect(
        contract.transferAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });
});

// Helper function to get current timestamp
async function getTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block?.timestamp || 0;
}
