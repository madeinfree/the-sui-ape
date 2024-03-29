import { useMemo, useEffect, useState } from 'react'
import axios from 'axios'
import Head from 'next/head'
import Container from 'react-bootstrap/Container'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Badge from 'react-bootstrap/Badge'

import { WalletProvider, useWallet } from '@mysten/wallet-adapter-react'
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-all-wallets'

import Navbar from '../components/Navbar'

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
        <Navbar />
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
      url: 'https://fullnode.testnet.sui.io:443',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getEvents',
        params: [
          {
            MoveEvent: `${process.env.NEXT_PUBLIC_PACKAGE}::sui_ape::ApeMint`,
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
            url: 'https://fullnode.testnet.sui.io:443',
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
                        href={`https://explorer.sui.io/objects/${ape.data.fields.id.id}?network=testnet`}
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
