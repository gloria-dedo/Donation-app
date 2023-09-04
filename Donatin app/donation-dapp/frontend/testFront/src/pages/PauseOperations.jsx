import { useContext, useEffect, useState } from "react";
import { useMetaMask } from "metamask-react";
import { ethers } from "ethers";
import { EthersContext } from "../utils/EtherContext";


function PauseOperations({ beneficiary }) {
    const { provider, donation, ethereum } = useContext(EthersContext);
    const [operationsPaused, setOperationsPaused] = useState(false);

    useEffect(() => {
        if(donation) {
      donation.emergencyStop().then((emergencyStop) => setOperationsPaused(emergencyStop));
      donation.on("EmergencyStopSet", (emergencyStop) => {
        console.log("Emergency Stop Set: ", emergencyStop);
        setOperationsPaused(emergencyStop)
    })

}
      return () => {
        donation?.removeAllListeners("EmergencyStopSet");
      }
    }, [ethereum, donation])
    

    const pauseOperations = async () => {
        if (ethereum) {
            // Get Access to Signer
            // Make Function Call
            console.log("Address: ", beneficiary);
            await donation.setEmergencyStop(!operationsPaused).catch((err) => alert(err.message));
            setOperationsPaused(!operationsPaused);

        }
    }

    return (
        <div>
            <div> {operationsPaused ? "Contract Operations are currently Paused": "Contract Operations Are active" } </div>
            <button onClick={pauseOperations}>{operationsPaused ? 'Restart Operations': 'Pause Operations'}</button>
        </div>
    );
}

export default PauseOperations;