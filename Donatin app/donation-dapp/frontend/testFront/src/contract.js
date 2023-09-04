import { ethers } from "ethers";
import ABI from "./abi.json";

const CONTRACT_ADDRESS = "0x4725F47b49E508856Afd6F0badDCb28d8f4427F6";
const provider = new ethers.providers.WebSocketProvider(`wss://polygon-mumbai.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || "" }`)

export const donation = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider )
