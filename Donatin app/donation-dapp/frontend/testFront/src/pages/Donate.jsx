import { useContext, useEffect, useState } from "react";
import { useMetaMask } from "metamask-react";
import { ethers } from "ethers";
import { donation } from "../contract";
import { EthersContext } from "../utils/EtherContext";


function Donate({ beneficiary }) {
    const { donation, ethereum } = useContext(EthersContext)
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");
    const [donated, setDonated] = useState(false);

    const donate = async () => {
        if (ethereum) {
            // Get Access to Signer
            // Make Function Call
            console.log("Address: ", beneficiary);
            donation.donate(message, {value: ethers.utils.parseEther(amount) }).then(()=>{
                setDonated('Thank you for your donation!');
            })
            .catch((err) => alert(err.message));

        }
    }

    return (
        <div>
            {donated && <div>{donated}</div>}
            <input type="text" placeholder="Amount in Matic" onChange={(e) => setAmount(e.target.value)} />
            <input type="text" placeholder="Message" onChange={(e) => setMessage(e.target.value)} />
            <button onClick={donate}>Donate</button>
        </div>
    );
}

export default Donate;