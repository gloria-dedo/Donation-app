import { ethers } from "hardhat";

async function main() {
    const donation = await ethers.deployContract("DonationContract", ['0xDb9ebFe6092f8B3Cb22A6236c69ca460fA1a4aE1']);

    await donation.waitForDeployment();

    console.log(`donation deployed to ${donation.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});