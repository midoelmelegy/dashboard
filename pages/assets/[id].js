import React, { Fragment, useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Head from 'next/head';
import CardDetails from "../../components/CardDetails";
import Loader from "../../components/Loader";
import { getToken } from "../../functions/UIStateFunctions";
import { useAppContext } from "../../libs/contextLib";

const Asset = ({ data }) => {
  // console.log('got data', data);
  
  const router = useRouter()
  const { id } = router.query
  const { globalState, setGlobalState } = useAppContext();
  const [token, setToken] = useState(data.token);
  const [loading, setLoading] = useState(false);

  /* useEffect(() => {
    getData();
  }, [id]); */

  const getData = () => {
    if (id) {
      (async () => {
        const token = await getToken(id);
        setToken(token);
        setLoading(false);
      })();
    }
  }

  return token ? (
    <Fragment>
      <Head>
        <title>{token.name} | Webaverse</title>
        <meta name="description" content={token.description + " | Webaverse"} />
        <meta property="og:title" content={token.name + " | Webaverse"} />
        <meta property={["webm","mp4"].indexOf(token.properties.ext) >=0 ? "og:video:url" : "og:image"} content={["gif","webm","mp4"].indexOf(token.properties.ext) >=0 ? token.animation_url : token.image} />
        {["webm","mp4"].indexOf(token.properties.ext) >=0 ?
          <meta property="og:type" content="video" />
        : null}
        {["webm","mp4"].indexOf(token.properties.ext) >=0 ?
          <meta property="og:video:width" content="994" />
        : null}
        {["webm","mp4"].indexOf(token.properties.ext) >=0 ?
          <meta property="og:video:height" content="720" />
        : null}
        {token.properties.ext === "mp4" ?
          <meta property="og:video:type" content="webm/mp4" />
        : null}
        {token.properties.ext === "webm" ?
          <meta property="og:video:type" content="video/webm" />
        : null}
        <meta name="theme-color" content="#c4005d" />
        {["webm","mp4"].indexOf(token.properties.ext) >=0 ?
          null
        :
          <meta name="twitter:card" content="summary_large_image" />
        }
        <script type="text/javascript" src="/geometry.js"></script>
      </Head>
      { !loading ?
          <CardDetails
             id={token.id}
             isMainnet={token.isMainnet}
             isPolygon={token.isPolygon}
             key={token.id}
             name={token.name}
             description={token.description}
             image={token.image}
             buyPrice={token.buyPrice}
             storeId={token.storeId}
             hash={token.properties.hash}
             animation_url={token.animation_url}
             external_url={token.external_url}
             filename={token.properties.filename}
             ext={token.properties.ext}
             totalSupply={token.totalSupply}
             balance={token.balance}
             ownerAvatarPreview={token.owner.avatarPreview}
             ownerUsername={token.owner.username}
             ownerAddress={token.owner.address}
             minterAvatarPreview={token.minter.avatarPreview}
             minterAddress={token.minter.address}
             minterUsername={token.minter.username}
             globalState={globalState}
             networkType="sidechain"
             getData={getData}
           />
      :
        <Loader loading={true} />
      }
    </Fragment>
  ) : null;
};
export default Asset;

export async function getServerSideProps(context) {
  const id = /^[0-9]+$/.test(context.params.id) ? parseInt(context.params.id, 10) : NaN;
  const token = !isNaN(id) ? (await getToken(id)) : null;

  return {
    props: {
      data: {
        token,
      },
    },
  };
}
