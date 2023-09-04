import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { DonationContract2, } from "../typechain-types";



describe("DonationContract",  function () {

  type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

  type Signer = PromiseType<ReturnType<typeof ethers.getSigner>>;

  let donationContract : DonationContract2, owner: Signer, donor1 : Signer, donor2: Signer, beneficiary1: Signer, beneficiary2: Signer;

  beforeEach(async function () {
    ({donationContract, owner, donor1, donor2, beneficiary1, beneficiary2} = await loadFixture(deployDonationFixture));

  });
  async function deployDonationFixture() {
    // Contracts are deployed using the first /account by default
    const [owner, donor1, donor2, beneficiary1, beneficiary2] = await ethers.getSigners();

    const Donation = await ethers.getContractFactory("DonationContract2");
    const donationContract : DonationContract2 = await Donation.deploy(beneficiary1.address);

    return {donationContract,  owner, donor1, donor2, beneficiary1, beneficiary2};
  }

  describe("Deployment", function () {
    it("Should set the right beneficiary", async function () {
   
      expect(await donationContract.currentBeneficiary()).to.equal(beneficiary1.address);
    });

})

   describe("donate", function () {

    it("should allow a user to donate to the contract", async function () {
      await donationContract.connect(donor1).donate("purpose", { value: ethers.parseEther("1") });

      const beneficiary1DonationAmount = await donationContract.getAmountReceived(beneficiary1.address);
      expect(beneficiary1DonationAmount).to.equal(ethers.parseEther("1"));
    });
    
    it("should not allow a user to donate to the contract if amount is 0", async function () {
      await expect(donationContract.connect(donor1).donate("purpose", { value: 0 }))
      .to.be.revertedWith("Donation amount must be greater than 0");
    });
    
    it("should not allow donations when emergency stopped", async function () {
      await donationContract.connect(owner).setEmergencyStop(true);
      await expect(donationContract.connect(donor1).donate("Trying to donate", { value: ethers.parseEther("1") })).to.be.revertedWith("Contract operations are currently paused");
    });
    
    it("should run donate function when funds are sent to contract", async function () {
      const beneficiary1DonationAmountBefore = await donationContract.getAmountReceived(beneficiary1.address);
      const tx = await donor1.sendTransaction({
        to: donationContract.target,
        value: ethers.parseEther("1"),
      });
      const beneficiary1DonationAmountAfter = await donationContract.getAmountReceived(beneficiary1.address);
      expect(beneficiary1DonationAmountAfter).to.equal(beneficiary1DonationAmountBefore + ethers.parseEther("1"));
    });


  });

  describe("setBeneficiary", function () {
    it("should allow the owner to set the beneficiary", async function () {
      await donationContract.connect(owner).setBeneficiary(donor1.address);

      const beneficiary = await donationContract.currentBeneficiary();
      expect(beneficiary).to.equal(donor1.address);
    });

    it("should not allow a non-owner to set the beneficiary", async function () {
      await expect(donationContract.connect(donor1).setBeneficiary(donor1.address)).to.be.revertedWith("Only the contract owner can call this function");
    });
  });

  describe('getDonations', function () {
    it('should return the donations', async function () {
      await donationContract.connect(donor1).donate("first", { value: ethers.parseEther("1") });
      await donationContract.connect(owner).setBeneficiary(beneficiary2.address);
      await donationContract.connect(donor2).donate("second", { value: ethers.parseEther("2") });
      const donations = await donationContract.getDonations();
      console.log('ds', donations);
      expect(donations.length).to.equal(2);
      expect(donations[0].donor).to.equal(donor1.address);
      expect(donations[0].amount).to.equal(ethers.parseEther("1"));
      expect(donations[0].message).to.equal("first");
      expect(donations[1].donor).to.equal(donor2.address);
      expect(donations[1].amount).to.equal(ethers.parseEther("2"));
      expect(donations[1].message).to.equal("second");
    });
  });

  describe("setEmergencyStop", function () {
    it("should allow the owner to set the emergency stop", async function () {
      await donationContract.connect(owner).setEmergencyStop(true);

      const emergencyStop = await donationContract.emergencyStop();
      expect(emergencyStop).to.equal(true);
    });

    it("should not allow a non-owner to set the emergency stop", async function () {
      await expect(donationContract.connect(donor1).setEmergencyStop(true)).to.be.revertedWith("Only the contract owner can call this function");
    });

    it('should emit a EmergencyStopSet event when the owner sets the emergency stop', async function () {
      const setEmergencyStopTransaction = donationContract.connect(owner).setEmergencyStop(true);
      await expect(setEmergencyStopTransaction)
        .to.emit(donationContract, "EmergencyStopSet")
        .withArgs(true);
    })

  });
  describe("withdraw", function () {
    
    it("should not allow a non-beneficiary to withdraw the funds", async function () {
      await expect(donationContract.connect(donor1).withdrawFunds()).to.be.revertedWith("No funds to withdraw or not a beneficiary");
    })

    it("should not allow withdrawal when emergency stopped", async function () {
      await donationContract.connect(donor1).donate("Thank you for your donation!", { value: ethers.parseEther("1") });
      await donationContract.connect(owner).setEmergencyStop(true);
      await expect(donationContract.connect(beneficiary1).withdrawFunds()).to.be.revertedWith("Contract operations are currently paused");    })
    

    it('should emit a Withdrawal event when a beneficiary withdraws funds', async function () {
      await donationContract.connect(donor1).donate("first", { value: ethers.parseEther("1") });
      const withdrawalTransaction = donationContract.connect(beneficiary1).withdrawFunds();
      const timestamp = (await (await withdrawalTransaction).provider.getBlock('latest'))?.timestamp;

      await expect(withdrawalTransaction)
        .to.emit(donationContract, "FundsWithdrawn")
        .withArgs(beneficiary1.address, ethers.parseEther('1'),  timestamp );
    })
    

    it("should allow beneficiaries to withdraw the funds", async function () {
        await donationContract.connect(donor1).donate("first", { value: ethers.parseEther("1") });
        await donationContract.connect(owner).setBeneficiary(beneficiary2.address);
        await donationContract.connect(donor2).donate("secon", { value: ethers.parseEther("2") });
        const ContractBalanceBefore = await ethers.provider.getBalance(await donationContract.getAddress());
  
        const beneficiary1BalanceBefore = await donationContract.getAmountReceived(beneficiary1.address);
        const beneficiary2BalanceBefore =await donationContract.getAmountReceived(beneficiary2.address);

        // console.log('topic: ', donationContract.filters.DonationReceived( undefined, undefined, undefined, undefined, undefined));
        


        const withdrawal1 = await donationContract.connect(beneficiary1).withdrawFunds();
        const withdrawal2 = await donationContract.connect(beneficiary2).withdrawFunds();

        // const txnReceipt = await event.getTransactionReceipt();
        // let eventLog = txnReceipt.logs.forEach(log=> console.log('log: ', contract.interface.parseLog(log))) // could be any index
        // let log = contract.interface.parseLog(eventLog); // Use the contracts interface
        
        
        const beneficiary1BalanceAfter = await donationContract.getAmountReceived(beneficiary1.address);
        const beneficiary2BalanceAfter =await donationContract.getAmountReceived(beneficiary2.address);
        
        const ContractBalanceAfter = await ethers.provider.getBalance(await donationContract.getAddress());
  
        // const receipt = await ethers.provider.getTransactionReceipt(withdrawal.hash)
        // const gasUsed = receipt?.gasUsed;
  
  
        expect(beneficiary1BalanceAfter).to.equal( beneficiary1BalanceBefore - ethers.parseEther("1")  );
        expect(beneficiary2BalanceAfter).to.equal( beneficiary2BalanceBefore - ethers.parseEther("2")  );
        expect(ContractBalanceAfter).to.equal( ContractBalanceBefore - ethers.parseEther("3") );
      
  
  
//   it("should not allow withdrawal if there are no funds", async function () {
//     await expect(donationContract.connect(beneficiary1).withdrawFunds()).to.be.revertedWith("No funds to withdraw");
 })
});
  
})