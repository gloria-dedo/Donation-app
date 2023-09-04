import { useEffect, useState, useContext } from 'react'
import { useMetaMask } from "metamask-react";
import { ethers } from "ethers";
// import { donation } from "../contract";
import { EthersContext } from '../utils/EtherContext';

export default function DonationHistory({setTotalDonations}) {

    const [history, setHistory] = useState([]);
    const {ethereum, donation, signer} = useContext(EthersContext);
    const [loading, setLoading] = useState(false);


useEffect(() => {
  // console.log('ethereum: s', ethereum)
    async function getCurrentBeneficiary() {
      if (donation) {
        loading || setLoading(true);

        const donationCounter = await donation.donationCounter();
        // console.log('donationCounter: ', donationCounter)
        //get block in which contract was deployed
        const contractBlockNumber = await donation.deploymentblockNumber()
        const currentBlockNumber = await donation.provider.getBlockNumber();
        // console.log('currentBlockNumber: ', currentBlockNumber);
        // console.log('contractBlockNumber: ', contractBlockNumber);


      donation.on("DonationReceived", (donationId, donor, beneficiary, amount, message, timestamp) => {
            console.log('DonationReceived: ', donationId, 'donor: ', donor, 'amount: ', amount, 'message: ', message, 'timestamp: ', timestamp);
            setHistory((history) => [formatDonation(donationId, donor, beneficiary, amount, message, timestamp), ...history ]);
            donation.getAmountReceived(beneficiary).then((donationsAmount) => {
              setTotalDonations(ethers.utils.formatEther(donationsAmount));
            })
        })

        //function to get events, 1000 blocks at a time, then recursively call itself until all events are retrieved
        async function getEvents() {
            let cursor = BigInt(contractBlockNumber);
            const events = [];

            async function getBatch(start){
                let end = BigInt(start) + BigInt(999);

                cursor = end + BigInt(1);
                if (end > BigInt(currentBlockNumber)) {
                    // console.log('end: ', end, 'currentBlockNumber: ', currentBlockNumber);
                    end = BigInt(currentBlockNumber);
                }
                const newEvents = await donation.queryFilter(donation.filters.DonationReceived(), parseInt(start), parseInt(end));
                // console.log('newEvents: ', newEvents);
                return newEvents;
            }

            let reverseCursor = BigInt(currentBlockNumber);

            async function getReverseBatch(end) {
              let start = BigInt(end) - BigInt(999);
          
              reverseCursor = start - BigInt(1);
              if (start < BigInt(contractBlockNumber)) {
                  // console.log('end: ', end, 'contractBlockNumber: ', contractBlockNumber);
                  start = BigInt(contractBlockNumber);
              }
              const newEvents = await donation.queryFilter(donation.filters.DonationReceived(), parseInt(start), parseInt(end));
              // console.log('newEvents: ', newEvents);
              return newEvents.reverse();
          }

            while ((events.length < donationCounter) && (cursor < BigInt(currentBlockNumber))) {
                // events.push(...await getBatch(cursor));
                events.push(...await getReverseBatch(reverseCursor));
            }

            return events;

        }

        const allEvents = await getEvents();

   const history = allEvents.map((event) => {
          // const eventLog = donation.interface.parseLog(event);
          const [donationId, donor, beneficiary, amount, message, timestamp] = event.args
          // console.log('eventLog: ', 'did', donationId, 'donor', donor, 'amount', amount, 'messsage', message, 'ts', timestamp);
            return formatDonation(donationId, donor, beneficiary, amount, message, timestamp)
        });

        setHistory(history);
        setLoading(false);
      }
    }

    getCurrentBeneficiary();

    
    return () => {
      donation?.removeAllListeners('DonationReceived');
    }
  }, [ethereum, donation, signer])


  
  return(
    <div >
    { loading ? 'Loading History...' : history.map((donation) =>{


           return <div key={donation.donationId}>
              {/* {console.log('donation: ', donation)} */}
            <div>Donation ID: {donation.donationId}</div>
            <div>Donor: {donation.donor}</div>
            <div>Beneficiary: {donation.beneficiary}</div>
            <div>Amount: {donation.amount}</div>
            <div>Message: {donation.message}</div>
            <div>Timestamp: {donation.timestamp}</div>
            <hr/>
            </div>
    } 
        
    )}
    </div>
  )}

function formatDonation(donationId, donor, beneficiary, amount, message, timestamp) {
  // console.log('format','donationId: ', donationId, 'donor: ', donor, 'beneficiary: ', beneficiary, 'amount: ', amount, 'message: ', message, 'timestamp: ', timestamp);
  return {
    donationId: String(donationId),
    donor,
    beneficiary,
    amount: ethers.utils.formatEther(amount || 0) + ' MATIC',
    message,
    timestamp: new Date(parseInt(timestamp) * 1000).toUTCString()
  };
}
