import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Container from 'react-bootstrap/Container'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Image from 'react-bootstrap/Image'
import Form from 'react-bootstrap/Form'

import { WalletProvider, useWallet } from '@mysten/wallet-adapter-react'
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-all-wallets'

import Navbar from '../components/Navbar'

export default function Arena() {
  const walletAdapters = useMemo(
    () => [new WalletStandardAdapterProvider()],
    []
  )

  return (
    <>
      <Head>
        <title>Sui APE mint</title>
        <meta name="description" content="The Sui APE War." />
        <link rel="icon" href="https://sui.io/favicon.png" />
      </Head>
      <WalletProvider adapters={walletAdapters}>
        <Navbar />
        <Main />
      </WalletProvider>
    </>
  )
}

function Main() {
  const APE_PACKAGE = process.env.NEXT_PUBLIC_PACKAGE
  const Playground = process.env.NEXT_PUBLIC_PLAYGROUND
  const GAS_BUDGET = 10000

  const { connected, signAndExecuteTransaction } = useWallet()
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState(false)
  const [ArenaApes, setArenaApes] = useState([])
  const [APE, setAPE] = useState()

  const handleFindApeFromArena = async () => {
    const { data } = await axios({
      method: 'POST',
      url: 'https://fullnode.testnet.sui.io:443',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getObjectsOwnedByObject',
        params: [Playground],
      },
    })

    const promises = data.result.map((object) => {
      return new Promise(async (resolve) => {
        const { data } = await axios({
          method: 'POST',
          url: 'https://fullnode.testnet.sui.io:443',
          data: {
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getObject',
            params: [object.objectId],
          },
        })
        resolve(data.result)
      })
    })
    const promisesResult = await Promise.all(promises)

    const promisesCheck = promisesResult
      .filter((object) => object.details.data.fields.status === 0)
      .map((object) => {
        return new Promise(async (resolve) => {
          const { data } = await axios({
            method: 'POST',
            url: 'https://fullnode.testnet.sui.io:443',
            data: {
              jsonrpc: '2.0',
              id: 1,
              method: 'sui_getObjectsOwnedByObject',
              params: [object.details.data.fields.id.id],
            },
          })
          resolve(data.result[0])
        })
      })

    const promisesCheckResult = await Promise.all(promisesCheck)

    const promisesArenaApes = promisesCheckResult.map((object) => {
      return new Promise(async (resolve) => {
        const { data } = await axios({
          method: 'POST',
          url: 'https://fullnode.testnet.sui.io:443',
          data: {
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getObject',
            params: [object.objectId],
          },
        })
        resolve(data.result)
      })
    })

    const arenaApes = await Promise.all(promisesArenaApes)
    console.log(arenaApes)
  }

  useEffect(() => {
    handleFindApeFromArena()
  }, [])

  return connected ? (
    <Container>
      <h1
        style={{
          marginTop: 10,
          textAlign: 'center',
        }}
      >
        <Alert variant="primary">天空競技場</Alert>
      </h1>
    </Container>
  ) : (
    <>
      <Container style={{ marginTop: 10 }}>
        <Alert variant="info">
          <Alert.Heading>
            請先點擊右上角連接 Sui 錢包或
            <a
              target="_blank"
              href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
            >
              進行安裝
            </a>
          </Alert.Heading>
          <div>連接錢包後，立即體驗鑄造 Sui APE</div>
        </Alert>
      </Container>
    </>
  )
}
