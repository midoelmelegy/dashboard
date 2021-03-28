import Web3 from "web3";
import React, { useState, useEffect, Fragment } from "react";
import { useToasts } from "react-toast-notifications";
import Link from "next/link";
import AssetCard from "./Card";
import { Networks, getBlockchain } from "../webaverse/blockchain.js";
import {
    resubmitAsset,
    getStuckAsset,
    addNftCollaborator,
    removeNftCollaborator,
    setAssetName,
    deleteAsset,
    setLoadoutState,
    clearLoadoutState,
    setAvatar,
    setHomespace,
    withdrawAsset,
    depositAsset,
    sellAsset,
    buyAsset,
} from "../functions/AssetFunctions.js";
import { isTokenOnMain } from "../functions/UIStateFunctions.js";
import Loader from "./Loader";

const CardDetails = ({
  id,
  name,
  description,
  image,
  hash,
  animation_url,
  ext,
  totalInEdition,
  numberInEdition,
  totalSupply,
  balance,
  ownerAvatarPreview,
  ownerUsername,
  ownerAddress,
  minterAvatarPreview,
  minterAddress,
  minterUsername,
  isMainnet,
  isPolygon,
  buyPrice,
  storeId,
  globalState,
  assetType,
  getData,
}) => {
  const { addToast } = useToasts();

  const [toggleViewOpen, setToggleViewOpen] = useState(true);
  const [toggleEditOpen, setToggleEditOpen] = useState(false);
  const [toggleAddOpen, setToggleAddOpen] = useState(false);
  const [toggleTradeOpen, setToggleTradeOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [imageView, setImageView] = useState("2d");
  const [tryOn, setTryOn] = useState(false);
  const [tokenOnMain, setTokenOnMain] = useState(false);
  const [networkName, setNetworkName] = useState(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (globalState.loginToken) {
      getOtherData();
      getData();
    }
  }, [globalState]);

  const getOtherData = () => {
    (async () => {
      const isStuck = await getStuckAsset("NFT", id, globalState);
      if (isStuck) {
        setStuck(true);
      }
    })();
    (async () => {
      const { contracts, getNetworkName } = await getBlockchain();
      const networkName = getNetworkName();
      setNetworkName(networkName);

      // TOOD
      const res = await fetch(`${networkName !== "main" ? `https://mainnet-tokens.webaverse.com/${id}` : `https://mainnet-tokens.webaverse.com/${id}`}`);
    
      const token = await res.json();
      const owner = token.owner.address;
      const tokenOnMain = owner === contracts.front.NFTProxy._address || owner === ("0x0000000000000000000000000000000000000000") ? false : true;

      setTokenOnMain(tokenOnMain);
    })();
  };

  let userOwnsThisAsset, userCreatedThisAsset;
  if (globalState && globalState.address) {
    userOwnsThisAsset =
      ownerAddress.toLowerCase() === globalState.address.toLowerCase();
    userCreatedThisAsset =
      minterAddress.toLowerCase() === globalState.address.toLowerCase();
  } else {
    userOwnsThisAsset = false;
    userCreatedThisAsset = false;
  }

    const ethEnabled = async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            window.ethereum.enable();
            const network = await window.web3.eth.net.getNetworkType();
            if (network === "main") {
                return true;
            } else if (network === "rinkeby"){
                return true;
            } else {
                handleError("You need to be on the Mainnet network.");
                return false;
            }
        }
        handleError("Please install MetaMask to use Webaverse!");
        return false;
      }
    }
    handleError("Please install MetaMask to use Webaverse!");
    return false;
  };

  const loginWithMetaMask = async (func) => {
    const enabled = await ethEnabled();
    if (!enabled) {
      return false;
    } else {
      const web3 = window.web3;
      try {
        const eth = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (eth && eth[0]) {
          return eth[0];
        } else {
          ethereum.on("accountsChanged", (accounts) => {
            func();
          });
          return false;
        }
      } catch (err) {
        handleError(err);
      }
    }
  };

  const handleSuccess = (msg, link) => {
    if (typeof msg === "object") {
      msg = JSON.stringify(msg);
    }
    addToast("Success!", {
      link: link,
      appearance: "success",
      autoDismiss: true,
    });
    getData();
    getOtherData();
    setLoading(false);
  };
  const handleError = (err) => {
    addToast("Error: " + err, { appearance: "error", autoDismiss: true });
    getData();
    getOtherData();
    setLoading(false);
  };

  const handleSetAssetName = (e) => {
    e.preventDefault();
    const name = prompt("What would you like to name this asset?", "");
    addToast("Setting item name to: " + name, {
      appearance: "info",
      autoDismiss: true,
    });
    setAssetName(name, hash, globalState, handleSuccess, handleError);
  };

  const handleSetAvatar = (e) => {
    e.preventDefault();
    addToast("Setting avatar to this item", {
      appearance: "info",
      autoDismiss: true,
    });
    setAvatar(id, globalState, handleSuccess, handleError);
  };

  const handleSetHomespace = (e) => {
    e.preventDefault();
    addToast("Setting homespace to this item", {
      appearance: "info",
      autoDismiss: true,
    });
    setHomespace(id, globalState, handleSuccess, handleError);
  };

  const clearLoadout = async (e) => {
    e.preventDefault();
    const loadoutNum = prompt("What loadout number do you want to clear?", "");
    addToast("Clearing loadout number: " + loadoutNum, {
      appearance: "info",
      autoDismiss: true,
    });
    await clearLoadoutState(
      loadoutNum,
      globalState,
      handleSuccess,
      handleError
    );
  };

  const addToLoadout = async (e) => {
    e.preventDefault();
    const loadoutNum = prompt(
      "What loadout number do you want to add this to?",
      "1"
    );
    addToast("Setting this item to loadout number " + loadoutNum, {
      appearance: "info",
      autoDismiss: true,
    });
    await setLoadoutState(
      id,
      loadoutNum,
      globalState,
      handleSuccess,
      handleError
    );
  };

  const handleBuyAsset = (e) => {
    e.preventDefault();
    var r = confirm("You are about to buy this, are you sure?");
    if (r == true) {
      addToast("Buying this item...", {
        appearance: "info",
        autoDismiss: true,
      });
      buyAsset(
        storeId,
        "sidechain",
        globalState.loginToken.mnemonic,
        handleSuccess,
        handleError
      );
    } else {
      handleError("canceled delete");
    }
  };

  const handleDeleteAsset = (e) => {
    e.preventDefault();
    var r = confirm(
      "You are about to permanently burn this item, are you sure?"
    );
    if (r == true) {
      addToast("Burning this item...", {
        appearance: "info",
        autoDismiss: true,
      });
      deleteAsset(
        id,
        globalState.loginToken.mnemonic,
        handleSuccess,
        handleError
      );
    } else {
      handleError("Canceled burn.");
    }
  };

  const handleSellAsset = (e) => {
    e.preventDefault();
    const sellPrice = prompt("How much would you like to sell this for?", "10");
    addToast("Selling this item for " + sellPrice + " SILK.", {
      appearance: "info",
      autoDismiss: true,
    });
    sellAsset(
      id,
      sellPrice,
      "sidechain",
      globalState.loginToken.mnemonic,
      handleSuccess,
      handleError
    );
  };

  const handleWithdraw = async (e) => {
    if (e) {
      e.preventDefault();
    }

    try {
      const mainnetAddress = await loginWithMetaMask(handleWithdraw);
      if (mainnetAddress) {
        addToast("Starting transfer of this item.", {
          appearance: "info",
          autoDismiss: true,
        });
        await withdrawAsset(
          id,
          mainnetAddress,
          globalState.address,
          globalState,
          handleSuccess,
          handleError
        );
      } else {
        handleError("No address received from MetaMask.");
      }
    } catch (err) {
      handleError(err.toString());
    }
  };

  const handleDeposit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    try {
      const mainnetAddress = await loginWithMetaMask(handleDeposit);
      if (mainnetAddress) {
        addToast("Starting transfer of this item.", {
          appearance: "info",
          autoDismiss: true,
        });
        await depositAsset(
          id,
          "webaverse",
          mainnetAddress,
          globalState.address,
          globalState,
          handleSuccess,
          handleError
        );
      } else {
        handleError("No address received from MetaMask.");
      }
    } catch (err) {
      handleError(err.toString());
    }
  };

  const handleAddCollaborator = () => {
    const address = prompt(
      "What is the address of the collaborator to add?",
      "0x0"
    );

    if (address) {
      addToast("Adding collaborator: " + address, {
        appearance: "info",
        autoDismiss: true,
      });
      addNftCollaborator(
        hash,
        address,
        handleSuccess,
        handleError,
        globalState
      );
    } else handleError("No address given.");
  };

  const handleRemoveCollaborator = () => {
    const address = prompt(
      "What is the address of the collaborator to remove?",
      "0x0"
    );

    if (address) {
      addToast("Removing collaborator: " + address, {
        appearance: "info",
        autoDismiss: true,
      });
      removeNftCollaborator(
        hash,
        address,
        handleSuccess,
        handleError,
        globalState
      );
      setLoading(true);
    } else handleError("No address given.");
  };

  return (
    <Fragment>
      {tryOn ? (
        <Fragment>
          <a className="button" onClick={() => setTryOn(false)}>
            {" "}
            Go back{" "}
          </a>
          <div className="IFrameContainer">
            <iframe
              className="IFrame"
              src={"https://app.webaverse.com/?t=" + id}
            />
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div className="assetDetails">
            {loading ? (
              <Loader loading={loading} />
            ) : (
              [
                <div className="assetDetailsLeftColumn">
                  <AssetCard
                    id={id}
                    key={id}
                    assetName={name}
                    ext={ext}
                    animation_url={animation_url}
                    description={description}
                    buyPrice={buyPrice}
                    image={image}
                    hash={hash}
                    numberInEdition={numberInEdition}
                    totalSupply={totalSupply}
                    balance={balance}
                    totalInEdition={totalInEdition}
                    assetType={assetType}
                    ownerAvatarPreview={ownerAvatarPreview}
                    ownerUsername={ownerUsername}
                    ownerAddress={ownerAddress}
                    minterAvatarPreview={minterAvatarPreview}
                    minterUsername={minterUsername}
                    minterAddress={minterAddress}
                    cardSize={""}
                    networkType={Networks.mainnetsidechain.displayName}
                    glow={false}
                    imageView={imageView}
                  />
                </div>,
                <div className="assetDetailsRightColumn">
                  {[
                    <div className="assetDetailsOwnedBy">
                      <span className={`creatorIcon creatorIcon tooltip`}>
                        <img
                          src={ownerAvatarPreview.replace(/\.[^.]*$/, ".png")}
                        />
                        <span className={`creatorName creatorName tooltiptext`}>
                          {ownerUsername}
                        </span>
                      </span>{" "}
                      Owned by{" "}
                      <Link href={`/accounts/` + ownerAddress}>
                        {ownerUsername}
                      </Link>
                    </div>,
                    <div className={`detailsBlock detailsBlockSet noselect`}>
                      {[
                        <div className="Accordion" key={1}>
                          <div
                            className="accordionTitle"
                            onClick={() => setToggleViewOpen(!toggleViewOpen)}
                          >
                            <span className="accordionTitleValue">View</span>
                            <span
                              className={`accordionIcon ${
                                toggleViewOpen ? "reverse" : ""
                              }`}
                            ></span>
                          </div>
                          {toggleViewOpen && (
                            <div className="accordionDropdown">
                              {[
                                is3d && imageView != "3d" && (
                                  <button
                                    className="assetDetailsButton"
                                    onClick={() => setImageView("3d")}
                                  >
                                    See in 3d
                                  </button>
                                ),
                                is3d && imageView != "2d" && (
                                  <button
                                    className="assetDetailsButton"
                                    onClick={() => setImageView("2d")}
                                  >
                                    See in 2d
                                  </button>
                                ),
                                <Link href={"/preview/" + id}>
                                  <button className="assetDetailsButton">
                                    Try in Webaverse
                                  </button>
                                </Link>,
                              ]}
                            </div>
                          )}
                        </div>,
                        userOwnsThisAsset && network === Networks.sidechain (
                          <div className="Accordion" key={2}>
                            <div
                              className="accordionTitle"
                              onClick={() => setToggleEditOpen(!toggleEditOpen)}
                            >
                              <span className="accordionTitleValue">Edit</span>
                              <span
                                className={`accordionIcon ${
                                  toggleEditOpen ? "reverse" : ""
                                }`}
                              ></span>
                            </div>
                            {toggleEditOpen && (
                              <div className="accordionDropdown">
                                {[
                                   (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={handleSetAssetName}
                                    >
                                      Change Asset Name
                                    </button>
                                  ),
                                    (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={handleDeleteAsset}
                                    >
                                      Burn This Item
                                    </button>
                                  ),
                                   (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={handleAddCollaborator}
                                    >
                                      Add Collaborator
                                    </button>
                                  ),
                                   (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={handleRemoveCollaborator}
                                    >
                                      Remove Collaborator
                                    </button>
                                  ),
                                ]}
                              </div>
                            )}
                          </div>
                        ),
                        userOwnsThisAsset && (
                          <div className="Accordion" key={2}>
                            <div
                              className="accordionTitle"
                              onClick={() => setToggleAddOpen(!toggleAddOpen)}
                            >
                              <span className="accordionTitleValue">Add</span>
                              <span
                                className={`accordionIcon ${
                                  toggleAddOpen ? "reverse" : ""
                                }`}
                              ></span>
                            </div>
                            {toggleAddOpen && (
                              <div className="accordionDropdown">
                                {[
                                  userOwnsThisAsset && (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={handleSetAvatar}
                                    >
                                      Set As Avatar
                                    </button>
                                  ),
                                  userOwnsThisAsset && (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={handleSetHomespace}
                                    >
                                      Set As Homespace
                                    </button>
                                  ),
                                  userOwnsThisAsset && (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={addToLoadout}
                                    >
                                      Add To Loadout
                                    </button>
                                  ),
                                  userOwnsThisAsset && (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={clearLoadout}
                                    >
                                      Clear From Loadout
                                    </button>
                                  ),
                                ]}
                              </div>
                            )}
                          </div>
                        ),
                        (stuck || userOwnsThisAsset || tokenOnMain) && (
                          <div className="Accordion" key={4}>
                            <div
                              className="accordionTitle"
                              onClick={() =>
                                setToggleTradeOpen(!toggleTradeOpen)
                              }
                            >
                              <span className="accordionTitleValue">Trade</span>
                              <span
                                className={`accordionIcon ${
                                  toggleTradeOpen ? "reverse" : ""
                                }`}
                              ></span>
                            </div>
                            {toggleTradeOpen && (
                              <div className="accordionDropdown">
                                {[
                                  !tokenOnMain && !userOwnsThisAsset && (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={() =>
                                        resubmitAsset(
                                          "NFT",
                                          id,
                                          globalState,
                                          handleSuccess,
                                          handleError
                                        )
                                      }
                                    >
                                      Resubmit Transfer
                                    </button>
                                  ),
                                  userOwnsThisAsset && Networks[networkName].transferOptions.map(network => {
                                      // TODO: Foreach
                                      <button
                                      className="assetDetailsButton"
                                      onClick={handleDeposit}
                                    >
                                      Transfer To {network}
                                    </button>
                                  }),
                                  userOwnsThisAsset && (
                                    <button
                                      className="assetDetailsButton"
                                      onClick={handleSellAsset}
                                    >
                                      Sell This Item
                                    </button>
                                  ),
                                ]}
                              </div>
                            )}
                          </div>
                        ),
                      ]}
                    </div>,
                    globalState.address &&
                      !userOwnsThisAsset &&
                      storeId &&
                      buyPrice && (
                        <div className="detailsBlock detailsBlockSet">
                          <button
                            className="assetDetailsButton"
                            onClick={handleBuyAsset}
                          >
                            Buy This Item
                          </button>
                        </div>
                      ),
                  ]}
                </div>,
              ]
            )}
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

export default CardDetails;
