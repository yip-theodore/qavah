//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Contract {
    struct Project {
        bytes32 id;
        address creator;
        string title;
        uint256 requestedAmount;
        string description;
        string encodedImage;
        string imageMeta;
        uint256 fundedAmount;
        uint256 claimedAmount;
        address[] donators;
        uint256[] donatedAmounts;
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
        string calldata encodedImage,
        string calldata imageMeta
    ) public {
        require(bytes(title).length > 0, "Project title must not be empty.");
        require(requestedAmount > 0, "Requested amount be greater than 0.");

        bytes32 id = random();
        while (bytes(projects[id].title).length > 0) {
            id = random();
        }
        Project memory project;
        project.id = id;
        project.creator = msg.sender;
        project.title = title;
        project.description = description;
        project.requestedAmount = requestedAmount;
        project.encodedImage = encodedImage;
        project.imageMeta = imageMeta;

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

    function donateToProject(bytes32 id) public payable {
        require(msg.value > 0, "Donation value must be greater than 0.");
        Project storage project = projects[id];
        require(
            msg.sender != project.creator,
            "You cannot donate to yourself."
        );
        project.fundedAmount += msg.value;
        project.donators.push(msg.sender);
        project.donatedAmounts.push(msg.value);

        emit FundsDonated(id, msg.sender);
    }

    function claimProjectFunds(bytes32 id) public {
        Project storage project = projects[id];
        require(
            msg.sender == project.creator,
            "Only project creator can claim the funds."
        );
        uint256 transferAmount = project.fundedAmount - project.claimedAmount;
        require(transferAmount > 0, "There is nothing to claim.");

        (bool success, ) = msg.sender.call{value: transferAmount}("");
        require(success, "Failed to send funds to project creator.");
        project.claimedAmount += transferAmount;

        emit FundsClaimed(id, msg.sender);
    }

    function random() private view returns (bytes32) {
        return keccak256(abi.encodePacked(block.difficulty, block.timestamp));
    }
}
