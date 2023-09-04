import { useContext, useEffect, useState } from "react";
import { useMetaMask } from "metamask-react";
import { ethers } from "ethers";
import { donation } from "../contract";
import { EthersContext } from "../utils/EtherContext";


function ChangeBeneficiary({ beneficiary }) {
    const { ethereum, provider } = useContext(EthersContext)
    const [newBeneficiary, setNewBeneficiary] = useState("");
    const [beneficiaryChanged, setBeneficiaryChanged] = useState(false);

    const changeBeneficiary = async () => {
        if (ethereum) {
            // Get Access to Signer
            // Make Function Call
            console.log("Address: ", beneficiary);
            await donation.setBeneficiary(newBeneficiary).catch((err) => alert(err.message));
            setBeneficiaryChanged('Beneficiary Changed!');

        }
    }

    return (
        <div>
            {beneficiaryChanged && <div>{beneficiary}</div>}
            <input type="text" placeholder="newBeneficiary" onChange={(e) => setNewBeneficiary(e.target.value)} />
            <button onClick={changeBeneficiary}>Change Beneficiary</button>
        </div>
    );
}

export default ChangeBeneficiary;