import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Image from 'react-bootstrap/Image'
import Form from 'react-bootstrap/Form'

import { WalletProvider, useWallet } from '@mysten/wallet-adapter-react'
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-all-wallets'

const MintDynamic = dynamic(() => import('../components/ConnectButton'), {
  ssr: false,
})

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
        <Navbar bg="light" expand="lg">
          <Container>
            <Navbar.Brand href="/">The Sui APE War</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link href="/">APEs</Nav.Link>
                <Nav.Link href="/mint">Mint</Nav.Link>
                <Nav.Link href="/ape">My APE</Nav.Link>
                <Nav.Link href="/arena">Arena</Nav.Link>
              </Nav>
            </Navbar.Collapse>
            <Navbar.Collapse className="justify-content-end">
              <MintDynamic />
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Main />
      </WalletProvider>
    </>
  )
}

function Main() {
  const APE_PACKAGE = '0x1709f2f79e8f6545c7d8f209491cb5af7738ea91'
  const Playground = '0xc3ba1bd4c08fbdd0b7c838dc0cdaba42473633d8'
  const GAS_BUDGET = 10000

  const { connected, signAndExecuteTransaction } = useWallet()
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState(false)
  const [ArenaApes, setArenaApes] = useState([])
  const [APE, setAPE] = useState()

  const handleFindApeFromArena = async () => {
    const { data } = await axios({
      method: 'POST',
      url: 'https://fullnode.devnet.sui.io:443',
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
          url: 'https://fullnode.devnet.sui.io:443',
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
            url: 'https://fullnode.devnet.sui.io:443',
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
          url: 'https://fullnode.devnet.sui.io:443',
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
  ) : null
}
