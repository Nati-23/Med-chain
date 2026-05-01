// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PrescriptionRegistry
 * @dev Gas-optimized prescription verification contract for Base blockchain
 * @notice Stores only prescription hashes on-chain for cost efficiency
 * @author MedChain Ethiopia
 */
contract PrescriptionRegistry {
    
    // ============ Structs ============
    
    struct Prescription {
        bytes32 hash;
        uint256 timestamp;
        bool isUsed;
        address creator;
    }
    
    // ============ State Variables ============
    
    /// @dev Mapping from hash to prescription data
    mapping(bytes32 => Prescription) private prescriptions;
    
    /// @dev Authorized issuers (doctors/healthcare providers)
    mapping(address => bool) public authorizedIssuers;
    
    /// @dev Contract administrator
    address public admin;
    
    /// @dev Total prescriptions count
    uint256 public totalPrescriptions;
    
    // ============ Events ============
    
    event PrescriptionCreated(
        bytes32 indexed hash,
        address indexed creator,
        uint256 timestamp
    );
    
    event PrescriptionUsed(
        bytes32 indexed hash,
        address indexed dispenser,
        uint256 timestamp
    );
    
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event AdminTransferred(address indexed newAdmin);
    
    // ============ Modifiers ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == admin || authorizedIssuers[msg.sender],
            "Not authorized"
        );
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        admin = msg.sender;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Authorize a new issuer (doctor/healthcare provider)
     * @param _issuer Address to authorize
     */
    function authorizeIssuer(address _issuer) external onlyAdmin {
        require(_issuer != address(0), "Invalid address");
        require(!authorizedIssuers[_issuer], "Already authorized");
        
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }
    
    /**
     * @dev Revoke issuer authorization
     * @param _issuer Address to revoke
     */
    function revokeIssuer(address _issuer) external onlyAdmin {
        require(authorizedIssuers[_issuer], "Not authorized");
        
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }
    
    /**
     * @dev Transfer admin rights
     * @param _newAdmin New administrator address
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
        emit AdminTransferred(_newAdmin);
    }
    
    // ============ Prescription Functions ============
    
    /**
     * @dev Create a new prescription hash on-chain
     * @param _hash Keccak256 hash of prescription data
     * @notice Only authorized issuers can create prescriptions
     * @notice Prevents duplicate hashes
     */
    function createPrescription(bytes32 _hash) external onlyAuthorized {
        require(_hash != bytes32(0), "Invalid hash");
        require(prescriptions[_hash].timestamp == 0, "Hash exists");
        
        prescriptions[_hash] = Prescription({
            hash: _hash,
            timestamp: block.timestamp,
            isUsed: false,
            creator: msg.sender
        });
        
        totalPrescriptions++;
        
        emit PrescriptionCreated(_hash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Batch create prescriptions (gas efficient for multiple)
     * @param _hashes Array of prescription hashes
     */
    function batchCreatePrescriptions(bytes32[] calldata _hashes) external onlyAuthorized {
        uint256 count = _hashes.length;
        require(count > 0, "Empty batch");
        require(count <= 50, "Batch too large");
        
        for (uint256 i = 0; i < count; i++) {
            bytes32 hash = _hashes[i];
            if (hash != bytes32(0) && prescriptions[hash].timestamp == 0) {
                prescriptions[hash] = Prescription({
                    hash: hash,
                    timestamp: block.timestamp,
                    isUsed: false,
                    creator: msg.sender
                });
                
                emit PrescriptionCreated(hash, msg.sender, block.timestamp);
            }
        }
        
        totalPrescriptions += count;
    }
    
    /**
     * @dev Mark prescription as used (dispensed)
     * @param _hash Prescription hash to mark
     * @notice Prevents double-dispensing
     */
    function markAsUsed(bytes32 _hash) external {
        require(prescriptions[_hash].timestamp != 0, "Not found");
        require(!prescriptions[_hash].isUsed, "Already used");
        
        prescriptions[_hash].isUsed = true;
        
        emit PrescriptionUsed(_hash, msg.sender, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Verify prescription status
     * @param _hash Prescription hash
     * @return status 0=NotFound, 1=Active, 2=Used, 3=Expired (check off-chain)
     * @return timestamp Creation timestamp
     * @return creator Address that created the prescription
     */
    function verifyPrescription(bytes32 _hash) 
        external 
        view 
        returns (
            uint8 status,
            uint256 timestamp,
            address creator
        ) 
    {
        Prescription memory p = prescriptions[_hash];
        
        if (p.timestamp == 0) {
            return (0, 0, address(0));
        }
        
        status = p.isUsed ? 2 : 1;
        return (status, p.timestamp, p.creator);
    }
    
    /**
     * @dev Check if prescription exists
     * @param _hash Prescription hash
     */
    function prescriptionExists(bytes32 _hash) external view returns (bool) {
        return prescriptions[_hash].timestamp != 0;
    }
    
    /**
     * @dev Check if prescription has been used
     * @param _hash Prescription hash
     */
    function isPrescriptionUsed(bytes32 _hash) external view returns (bool) {
        return prescriptions[_hash].isUsed;
    }
    
    /**
     * @dev Get full prescription details
     * @param _hash Prescription hash
     */
    function getPrescription(bytes32 _hash) 
        external 
        view 
        returns (Prescription memory) 
    {
        return prescriptions[_hash];
    }
    
    /**
     * @dev Check if address is authorized issuer
     * @param _address Address to check
     */
    function isAuthorized(address _address) external view returns (bool) {
        return _address == admin || authorizedIssuers[_address];
    }
}
