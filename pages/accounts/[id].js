import Web3 from 'web3';
import React, { useState, useEffect } from 'react'
import Head from 'next/head';
import { useToasts } from 'react-toast-notifications';
import { useRouter } from 'next/router';
import { useAppContext } from "../../libs/contextLib";
import { getInventoryForCreator, getProfileForCreator, getStoreForCreator, getBalance } from "../../functions/UIStateFunctions.js";
import { removeMainnetAddress, addMainnetAddress, resubmitAsset, setName, getLoadout, withdrawSILK, depositSILK, resubmitSILK } from "../../functions/AssetFunctions.js";
import {mainnetSignatureMessage, proofOfAddressMessage} from "../../constants/UnlockConstants.js";
import {getAddressProofs, getAddressesFromProofs, formatError} from '../../functions/Functions.js';
import {getBlockchain} from "../../webaverse/blockchain.js";

import Loader from "../../components/Loader";
import CardGrid from "../../components/CardGrid";
import ProfileHeader from "../../components/Profile";

const Account = ({ data, selectedView }) => {  
  const {addToast} = useToasts();
  const router = useRouter()
  const {id} = router.query;
  const {globalState, setGlobalState} = useAppContext();
  const [inventory, setInventory] = useState(data.inventory);
  const [balance, setBalance] = useState(data.balance);
  const [loadout, setLoadout] = useState(data.loadout);
  const [profile, setProfile] = useState(data.profile);
  const [store, setStore] = useState(data.store);
  const [selectedTab, setSelectedTab] = useState("inventory");
  const [loading, setLoading] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [addresses, setAddresses] = useState([]);

  /* useEffect(() => {
    if (id && !profile || !balance || !inventory || !store || !loadout) {
      getData();
    }
  }, []); */
  
  useEffect(async () => {
    const {
      web3,
    } = await getBlockchain();
    
    const addressProofs = getAddressProofs(profile);
    const addresses = await getAddressesFromProofs(addressProofs, web3, proofOfAddressMessage);
    // console.log('loaded addresses', addresses);
    setAddresses(addresses);
  }, [profile]);

  const addressProofs = getAddressProofs(profile);
  // console.log('render addresses', addresses);

  const getData = () => {
    (async () => {
      const profile = await getProfileForCreator(id);
      setProfile(profile);
    })();
    (async () => {
      const inventory = await getInventoryForCreator(id);
      if (inventory.length > 0) {
        setInventory(inventory);
      } else {
        setInventory([]);
      }
    })();
    (async () => {
      const store = await getStoreForCreator(id);
      setStore(store);
    })();
    (async () => {
      const loadout = await getLoadout(id);
      setLoadout(loadout);
    })();
    (async () => {
      const balance = await getBalance(id);
      setBalance(balance);
    })();
  }

  const _handleTokenClick = tokenId => e => {
    router.push('/assets/' + tokenId);
  };
  const handleTabToggle = tab => {
    setSelectedTab(tab);
  };
  const logout = () => {
    setGlobalState({ ...globalState, logout: "true" });
  };
  const handleSuccess = (msg, link) => {
    if (typeof msg === "object") {
      msg = JSON.stringify(msg);
    }
    addToast("Success!", { link: link, appearance: 'success', autoDismiss: true, });
    console.log("success!");
    setLoading(false);
    if (window != "undefined") {
      getData();
    }
  };
  const handleError = err => {
    console.warn(err);
    addToast(formatError(err), { appearance: 'error', autoDismiss: true, })
    console.log("error", err);
    setLoading(false);
  };
  const handleAddMainnetAddress = async () => {
    addToast(mainnetSignatureMessage, { appearance: 'info', autoDismiss: true, });
    await addMainnetAddress(profile, globalState, handleSuccess, handleError);
  }

  const handleRemoveMainnetAddress = async () => {
    addToast("Removing mainnet address.", { appearance: 'info', autoDismiss: true, });
    await removeMainnetAddress(globalState, handleSuccess, handleError);
  }

  const ethEnabled = () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      window.ethereum.enable();
      return true;
    }
    alert("Please install MetaMask to use Webaverse!");
    return false;
  }
  const loginWithMetaMask = async (func) => {
    if (!ethEnabled()) {
      return;
    } else {
      const web3 = window.web3;
      try {
        const eth = await window.ethereum.request({ method: 'eth_accounts' });
        if (eth && eth[0]) {
          //setMainnetAddress(eth[0]);
          return eth[0];
        } else {
          ethereum.on('accountsChanged', (accounts) => {
            //setMainnetAddress(accounts[0]);
            func();
          });
          return false;
        }
      } catch(err) {
        handleError(err);
      }
    }
  };
  const handleDeposit = async (e) => {
    if(e) {
      e.preventDefault();
    }

    setLoading(true);

    try {
      const ethAccount = await loginWithMetaMask(handleWithdraw);
      if (ethAccount) {
        const amount = prompt("How much SILK do you want to transfer?", "10");
        const mainnetAddress = prompt("What mainnet address do you want to transfer to?", "0x0");
        await depositSILK(amount, mainnetAddress, globalState, handleSuccess, handleError);
        handleSuccess();
      } else {
        setLoading(false);
      }
    } catch (err) {
      handleError(err.toString());
    }
  };
  const handleWithdraw = async (e) => {
    if(e) {
      e.preventDefault();
    }

    setLoading(true);

    try {
      const ethAccount = await loginWithMetaMask(handleWithdraw);
      if (ethAccount) {
        const amount = prompt("How much SILK do you want to transfer?", "10");
        const mainnetAddress = prompt("What mainnet address do you want to transfer from?", "0x0");
        await withdrawSILK(amount, mainnetAddress, globalState.address, globalState, handleSuccess, handleError);
        handleSuccess();
      } else {
        setLoading(false);
      }
    } catch (err) {
      handleError(err.toString());
    }
  };
  
  // console.log('got profile', profile);

  return (<>
    <Head>
      <title>{profile.name} | Webaverse</title>
      <meta name="description" content={"Check out " + profile.name + "'s items on Webaverse."} />
      <meta property="og:title" content={profile.name + "'s account | Webaverse"} />
      <meta property="og:image" content={profile.avatarPreview ? profile.avatarPreview.replace(/\.[^.]*$/, '.png') : "./preview.png"} />
      <meta name="theme-color" content="#c4005d" />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  {
    loading || !loadout || !store || !inventory || !balance || !profile ?
    <Loader loading={true} />
  :
    <div className="profile-page">
        <ProfileHeader
          key="profileHeader"
          loadout={loadout}
          balance={balance}
          profile={profile}
          addresses={addresses}
        />
        {/* <div key="profileBodynav" className="profileBodyNav">
          <div className="profileBodyNavContainer">
            {store && store.length > 0 && (
            <a className={`profileNavLink ${selectedTab === "store" ? "active disable" : ""}`} onClick={() => {
              handleTabToggle("store");
            }}>
              Store
            </a>)}
            {inventory && inventory.length > 0 && (
            <a className={`profileNavLink ${selectedTab === "inventory" ? "active disable" : ""}`} onClick={() => handleTabToggle("inventory")}>
              Inventory
            </a>)}
            {globalState && globalState.address === id.toLowerCase() && (
            <a className={`profileNavLink ${selectedTab === "settings" ? "active disable" : ""}`} onClick={() => handleTabToggle("settings")}>
              Settings
            </a>)}
          </div>
        </div> */}
        <div key="profileBodyAssets" className="profileBodyAssets">
          <div className="assetDetailsLeft">
            <div className="name">NFTs</div>
          </div>
          {selectedTab === "store" && store && (
            <CardGrid key="storeCards" data={store} globalState={globalState} selectedView={selectedView} cardSize="small"onTokenClick={_handleTokenClick} />
          )}
          {selectedTab === "inventory" && inventory && (
            <CardGrid key="inventoryCards" data={inventory} globalState={globalState} selectedView={selectedView}cardSize="small" onTokenClick={_handleTokenClick} />
          )}
        </div>
    </div>
  }</>)
};
export default Account;

export async function getServerSideProps(context) {
  const id = context.params.id;

  const [
    profile,
    inventory,
    store,
    loadout,
    balance,
  ] = await Promise.all([
    getProfileForCreator(id),
    getInventoryForCreator(id),
    getStoreForCreator(id),
    getLoadout(id),
    getBalance(id),
  ]);

  return { 
    props: { 
      data: {
        profile,
        inventory,
        store,
        loadout,
        balance,
      }
    } 
  }
}
