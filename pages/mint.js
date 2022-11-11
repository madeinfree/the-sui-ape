import { useMemo, useState } from 'react'
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

export default function Home() {
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
  const APE_PACKAGE = '0x541317a916324727472643d92875ed66d0fa4996'
  const APE_REGISTER = '0x392d3b30b920aade7815510a2bbf7ba4a31646d4'
  const APE_ISSUE_CAP = '0x84528cdcaead5caf083a9974a38f120c7bfc8b7b'
  const APE_ZOO = '0x5381ba47187266f77097692812abed44dc36456f'
  const GAS_BUDGET = 10000

  const { connected, signAndExecuteTransaction } = useWallet()
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState(false)
  const [APE, setAPE] = useState()
  const [isPending, setIsPending] = useState(false)
  const [name, setName] = useState('')

  const handleMintAPE = () => {
    if (!name) {
      alert('請輸入角色名稱')
      return
    }
    setIsPending(true)
    signAndExecuteTransaction({
      kind: 'moveCall',
      data: {
        packageObjectId: APE_PACKAGE,
        module: 'sui_ape',
        function: 'mint',
        typeArguments: [],
        arguments: [APE_REGISTER, APE_ISSUE_CAP, APE_ZOO, name],
        gasBudget: GAS_BUDGET,
      },
    })
      .then((resp) => {
        if (resp.effects.status.status == 'success') {
          const apeMintEvent = resp.effects.events[5].moveEvent.fields
          setAPE({
            id: apeMintEvent.id,
            url: apeMintEvent.url,
          })
          setSuccess(true)
          setErr()
        } else {
          setErr(resp.effects.status.error)
        }
      })
      .catch((error) => {
        console.log(error)
        setErr(error.message)
      })
      .finally(() => {
        setIsPending(false)
      })
  }

  const handleClearAll = () => {
    setSuccess(false)
    setAPE()
  }

  return (
    <>
      {connected ? (
        <Container>
          <h1
            style={{
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            <Alert variant="primary">創建角色</Alert>
          </h1>
          {success ? (
            <div className="text-center">
              <Alert variant="secondary">
                <Alert.Heading>建立成功</Alert.Heading>
                <p>
                  角色資訊 <br />
                  <a
                    target="_blank"
                    href={`https://explorer.devnet.sui.io/objects/${APE.id}`}
                  >
                    {APE.id}
                  </a>
                </p>
                <hr />
                <div className="d-flex justify-content-center">
                  <Button variant="outline-primary" onClick={handleClearAll}>
                    再次建立
                  </Button>
                </div>
              </Alert>
              <Image src={APE.url} />
            </div>
          ) : isPending ? (
            <div className="text-center">腳色建立中</div>
          ) : (
            <div className="d-grid gap-2">
              <>
                <Form.Label htmlFor="name">角色名稱</Form.Label>
                <Form.Control
                  value={name}
                  type="text"
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                />
                <Form.Text id="nameBlock" muted>
                  取一個適合的角色名稱並點擊確認建立
                </Form.Text>
              </>
              <Button variant="dark" onClick={handleMintAPE}>
                確認建立
              </Button>
            </div>
          )}
        </Container>
      ) : (
        <>
          <Container style={{ marginTop: 10 }}>
            <Alert variant="info">
              <Alert.Heading>請先點擊右上角連接 Sui 錢包</Alert.Heading>
              <div>連接錢包後，立即體驗鑄造 Sui APE</div>
            </Alert>
          </Container>
        </>
      )}
    </>
  )
}
