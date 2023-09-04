import { useContext, useEffect, useState } from 'react'
import './App.css'
import { useMetaMask } from "metamask-react";
import Donate from './pages/Donate';
import { ethers } from "ethers";
import DonationHistory from './pages/DonationHistory';
import ChangeBeneficiary from './pages/ChangeBeneficiary';
import PauseOperations from './pages/PauseOperations';
import { EthersContext } from './utils/EtherContext';
import WithdrawFunds from './pages/WithdrawFunds';

function App() {
  const [beneficiary, setBeneficiary] = useState("");
  const [totalDonations, setTotalDonations] = useState(0);
  const { donation, status, connect, account, chainId, ethereum } = useContext(EthersContext)

  const { switchChain } = useMetaMask();


  useEffect(() => {
    async function getCurrentBeneficiary() {
      if (donation) {
        // console.log("Ethereum: ", ethereum)
        // Get Access to Signer
        // console.log({signer, donation});
        // Make Function Call
        try {
          const currentBeneficiary = await donation.currentBeneficiary()
          setBeneficiary(currentBeneficiary);
          const donationsAmount = await donation.getAmountReceived(currentBeneficiary);
          setTotalDonations(ethers.utils.formatEther(donationsAmount));
          donation.on("FundsWithdrawn", (toBenefitiary, amount, timestamp) => {
            console.log('FundsWithdrawn: ', toBenefitiary, 'amount: ', ethers.utils.formatEther(amount), 'timestamp: ', timestamp);
            (toBenefitiary === beneficiary) && donation.getAmountReceived(beneficiary).then((donationsAmount) => {
              setTotalDonations(ethers.utils.formatEther(donationsAmount));
            })
          })
        } catch (error) {
          console.log(error)
        }
      }
    }

    getCurrentBeneficiary();

    return () => {
    }
  }, [ethereum, donation, beneficiary])


  if (status === "initializing") return <div>Synchronisation with MetaMask ongoing...</div>

  if (status === "unavailable") return <div>MetaMask not available </div>

  if (status === "notConnected") return <button onClick={connect}>Connect to MetaMask</button>

  if (status === "connecting") return <div>Connecting...</div>

  if (status === "connected" && chainId != "0x13881") return (
    <div>
      <h1>You're on the wrong network</h1>
      <button onClick={() => switchChain("0x13881")}>Switch to MATIC Mumbai</button>
    </div>
  )

  if (status === "connected" && chainId === "0x13881")

    return (
      <div>
        <div>Connected account {account} on chain ID {chainId}</div>
        <div>Current Beneficiary: {beneficiary}</div>
        <div>Total Donations: {totalDonations} MATIC</div>
        {/* Import Add EC Page */}
        <hr />
        <h3>Donate</h3>
        <Donate beneficiary={beneficiary} />
        <hr />
        <h3>Donation History</h3>
        <DonationHistory setTotalDonations={setTotalDonations} />
        <hr />
        <h3>Change Beneficiary</h3>
        <ChangeBeneficiary />
        <hr />
        <h3>Pause Operations</h3>
        <PauseOperations />
        <hr />
        <h3>Withdraw Funds</h3>
        <WithdrawFunds />
        <hr />
        {/* <h3>WithdrawalHistory</h3> */}
        {/* <WithdrawalHistory /> */}
        <br /><br /><br />
      </div>
    )


  return null;
}

export default App
