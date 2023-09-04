import { useEffect, useState, useContext } from 'react'
import { useMetaMask } from "metamask-react";
import { ethers } from "ethers";
import { EthersContext } from '../utils/EtherContext';

export default function WithdrawalHistory() {

    const [history, setHistory] = useState([]);
    const {ethereum, donation, signer} = useContext(EthersContext);
    const [loading, setLoading] = useState(false);


useEffect(() => {
  // console.log('ethereum: s', ethereum)
    async function getHistory() {
      if (donation) {
        loading || setLoading(true);
        const donationCounter = await donation.donationCounter();
        const contractBlockNumber = await donation.deploymentblockNumber()
        const currentBlockNumber = await donation.provider.getBlockNumber();
        
        async function getEvents() {
            let cursor = BigInt(contractBlockNumber);
            const events = [];

            const filter1 = await donation.filters.DonationReceived().getTopicFilter()
            const filter2 = await donation.filters.FundsWithdrawn().getTopicFilter()
            
            const topicFilter = [
                filter1.concat(filter2)
            ] 
            
            async function getBatch(start){
                let end = BigInt(start) + BigInt(999);

                cursor = end + BigInt(1);
                if (end > BigInt(currentBlockNumber)) {
                    // console.log('end: ', end, 'currentBlockNumber: ', currentBlockNumber);
                    end = BigInt(currentBlockNumber);
                }
                const newEvents = await donation.queryFilter(topicFilter, parseInt(start), parseInt(end));
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
              const newEvents = await donation.queryFilter(donation.filters.DonationReceived, parseInt(start), parseInt(end));
              // console.log('newEvents: ', newEvents);
              return newEvents.reverse();
          }

            while ((events.length < donationCounter) && (cursor < BigInt(currentBlockNumber))) {
                // console.log('events: ', events.length);
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

    getHistory();

    
    return () => {
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
    amount: ethers.utils.formatEther(amount || 0),
    message,
    timestamp: new Date(parseInt(timestamp) * 1000).toUTCString()
  };
}
