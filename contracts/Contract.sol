//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Qavah.sol";

contract Contract is Initializable {
    address public usdTokenAddress;
    string public siteUrl;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(address tokenAddress, string calldata url)
        public
        initializer
    {
        usdTokenAddress = tokenAddress;
        siteUrl = url;
    }

    struct Project {
        bytes32 id;
        address creator;
        string title;
        uint256 requestedAmount;
        string description;
        string image;
        uint256 fundedAmount;
        uint256 claimedAmount;
        address[] donators;
        uint256 createdAt;
        Qavah qavah;
    }
    mapping(bytes32 => Project) projects;
    bytes32[] projectIds;

    event ProjectCreated(bytes32 id, address indexed from);
    event FundsDonated(bytes32 indexed id, address from);
    event FundsClaimed(bytes32 indexed id, address from);

    function createProject(
        string calldata title,
        string calldata description,
        uint256 requestedAmount,
        string calldata image
    ) public {
        require(bytes(title).length > 0, "Project title must not be empty.");
        require(requestedAmount > 0, "Requested amount be greater than 0.");

        bytes32 id = keccak256(
            abi.encodePacked(block.timestamp, projectIds.length)
        );
        require(bytes(projects[id].title).length == 0, "Internal error.");

        Project memory project;
        project.id = id;
        project.creator = msg.sender;
        project.title = title;
        project.description = description;
        project.requestedAmount = requestedAmount;
        project.image = image;
        project.createdAt = block.timestamp;
        project.qavah = new Qavah();

        projects[id] = project;
        projectIds.push(id);

        emit ProjectCreated(id, msg.sender);
    }

    function getProjects() public view returns (Project[] memory) {
        Project[] memory _projects = new Project[](projectIds.length);
        for (uint256 i = 0; i < projectIds.length; i++) {
            _projects[i] = projects[projectIds[i]];
        }
        return _projects;
    }

    function getProject(bytes32 id) public view returns (Project memory) {
        return projects[id];
    }

    function getQavahsCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < projectIds.length; i++) {
            count += projects[projectIds[i]].donators.length;
        }
        return count;
    }

    function donateToProject(bytes32 id, uint256 amount) public {
        Project storage project = projects[id];
        require(
            project.fundedAmount < project.requestedAmount,
            "Campaign is closed."
        );
        require(
            msg.sender != project.creator,
            "You cannot donate to yourself."
        );
        require(
            IERC20(usdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                amount
            ),
            "Transfer failed."
        );
        uint256 donationPercentage = (100 * amount) / project.requestedAmount;
        require(donationPercentage > 0, "Amount too low.");
        uint256 donationAmount = (donationPercentage *
            project.requestedAmount) / 100;
        project.fundedAmount += donationAmount;
        project.donators.push(msg.sender);

        bytes memory svg = abi.encodePacked(
            '<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"><style>image { opacity: 0.2; } image:nth-of-type(-n+',
            Strings.toString(project.donators.length),
            ") { opacity: 1; }</style>",
            getTilesBytes(project.image, project.id),
            "</svg>"
        );
        bytes memory dataURI = abi.encodePacked(
            '{ "name": "Qavah #',
            Strings.toString(getQavahsCount()),
            '", "description": "',
            abi.encodePacked(siteUrl, Strings.toHexString(uint256(id))),
            '", "image": "data:image/svg+xml;base64,',
            Base64.encode(svg),
            '", "amount": ',
            Strings.toString(donationAmount / 1e18),
            ', "timestamp": ',
            Strings.toString(block.timestamp),
            " }"
        );
        project.qavah.safeMint(
            msg.sender,
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(dataURI)
                )
            )
        );

        emit FundsDonated(id, msg.sender);
    }

    function shuffleArray(bytes[] memory array, uint256 entropy) private pure {
        for (uint256 i = array.length - 1; i > 0; i--) {
            uint256 swapIndex = entropy % (array.length - i);
            bytes memory currentIndex = array[i];
            bytes memory indexToSwap = array[swapIndex];
            array[i] = indexToSwap;
            array[swapIndex] = currentIndex;
        }
    }

    function getTilesBytes(string storage src, bytes32 id)
        private
        pure
        returns (bytes memory)
    {
        uint256 root = 2;
        bytes[] memory tiles = new bytes[](root * root);
        for (uint256 y = 0; y < root; y++) {
            for (uint256 x = 0; x < root; x++) {
                tiles[y * root + x] = abi.encodePacked(
                    '<image href="',
                    src,
                    '" width="640" height="360" clip-path="inset(',
                    Strings.toString((y * 100) / root),
                    "% ",
                    Strings.toString(((root - x - 1) * 100) / root),
                    "% ",
                    Strings.toString(((root - y - 1) * 100) / root),
                    "% ",
                    Strings.toString((x * 100) / root),
                    '%)"></image>'
                );
            }
        }
        shuffleArray(tiles, uint256(id));
        bytes memory tilesBytes;
        for (uint256 i = 0; i < tiles.length; i++) {
            tilesBytes = abi.encodePacked(tilesBytes, tiles[i]);
        }
        return tilesBytes;
    }

    function claimProjectFunds(bytes32 id) public {
        Project storage project = projects[id];
        require(
            msg.sender == project.creator,
            "Only project creator can claim the funds."
        );
        uint256 transferAmount = project.fundedAmount - project.claimedAmount;
        require(transferAmount > 0, "There is nothing to claim.");

        require(
            IERC20(usdTokenAddress).transfer(msg.sender, transferAmount),
            "Transfer failed."
        );
        project.claimedAmount += transferAmount;

        emit FundsClaimed(id, msg.sender);
    }
}
