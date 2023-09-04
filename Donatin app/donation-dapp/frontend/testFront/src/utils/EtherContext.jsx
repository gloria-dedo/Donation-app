import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useMetaMask } from "metamask-react";
import { donation } from "../contract";

const EthersContext = createContext();

function EthersProvider({ children }) {
    const { status, connect, account, chainId, ethereum } = useMetaMask();
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [connectedContract, setConnectedContract] = useState(null);



    useEffect(() => {
        async function init() {
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const newSigner = provider.getSigner();
                setConnectedContract(donation.connect(newSigner));
                setProvider(provider);
                setSigner(signer);
            }
        }
        init();
    }, [ethereum, signer]);

    return (
        <EthersContext.Provider value={{ provider, signer, donation: connectedContract, status, connect, account, chainId, ethereum }}>
            {children}
        </EthersContext.Provider>
    );
}

export { EthersContext, EthersProvider };