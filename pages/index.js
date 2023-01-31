import { useMemo, useEffect, useState } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Badge from 'react-bootstrap/Badge'

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
  const [APEs, setAPEs] = useState([])

  const fetchAPEMintEvents = async () => {
    const { data } = await axios({
      method: 'POST',
      url: 'https://fullnode.devnet.sui.io:443',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getEvents',
        params: [
          {
            MoveEvent:
              '0x1709f2f79e8f6545c7d8f209491cb5af7738ea91::sui_ape::ApeMint',
          },
          null,
          null,
          null,
        ],
      },
    })
    if (data?.result?.data) {
      const promises = data.result.data.map((event) => {
        return new Promise(async (resolve) => {
          const { data } = await axios({
            method: 'POST',
            url: 'https://fullnode.devnet.sui.io:443',
            data: {
              jsonrpc: '2.0',
              id: 1,
              method: 'sui_getObject',
              params: [event.event.moveEvent.fields.id],
            },
          })
          resolve(data.result.details)
        })
      })
      const promisesResult = await Promise.all(promises)
      setAPEs(promisesResult)
    }
  }

  useEffect(() => {
    fetchAPEMintEvents()
  }, [])

  const { connected } = useWallet()
  return (
    <>
      {connected ? null : (
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
      )}
      <Container>
        <h1
          style={{
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          <Alert variant="primary">APEs Ground</Alert>
        </h1>
        <Row xs={2} md={2} lg={4} className="g-4 mb-3">
          {APEs.map((ape) => {
            return (
              <Col key={ape.data.fields.id.id}>
                <Card style={{ borderRadius: 30 }}>
                  <Card.Img variant="top" src={ape.data.fields.url} />
                  <Card.Body>
                    <Card.Title>
                      <a
                        target="_blank"
                        style={{ textDecoration: 'none' }}
                        href={`https://explorer.devnet.sui.io/objects/${ape.data.fields.id.id}`}
                      >
                        {ape.data.fields.name} #{ape.data.fields.n}
                      </a>
                    </Card.Title>
                    <Card.Text>
                      <Badge bg="dark">RANK: {ape.data.fields.rank}</Badge>
                      <br />
                      <Badge bg="primary">
                        HP: {ape.data.fields.attribute.fields.hp}
                      </Badge>
                      <br />
                      <Badge bg="primary">
                        ATK: {ape.data.fields.attribute.fields.atk}
                      </Badge>
                      <br />
                      <Badge bg="primary">
                        DEF {ape.data.fields.attribute.fields.def}
                      </Badge>
                      <br />
                      <Badge bg="primary">
                        HIT: {ape.data.fields.attribute.fields.hit}
                      </Badge>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Container>
    </>
  )
}
