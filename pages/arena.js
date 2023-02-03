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
  const APE_PACKAGE = '0xabf0d4e90e89c9166f81c34f3c1427a11d61964d'
  const Playground = '0xc33ae00c2edb0e4f65e9b710f7abf51756fd3644'
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
