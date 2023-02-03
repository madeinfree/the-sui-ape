import { useEffect, useMemo, useState } from 'react'
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
import Button from 'react-bootstrap/Button'
import Stack from 'react-bootstrap/Stack'

import { WalletProvider, useWallet } from '@mysten/wallet-adapter-react'
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-all-wallets'

const MintDynamic = dynamic(() => import('../components/ConnectButton'), {
  ssr: false,
})

export default function Ape() {
  const walletAdapters = useMemo(
    () => [new WalletStandardAdapterProvider()],
    []
  )

  return (
    <>
      <Head>
        <title>My Sui APE</title>
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

  const [APEs, setAPEs] = useState([])
  const [ArenaAPEs, setArenaAPEs] = useState([])
  const { connected, wallet, signAndExecuteTransaction } = useWallet()
  const handleFetchApe = async () => {
    const addresses = await wallet?.getAccounts()
    const apes = await axios({
      method: 'POST',
      url: 'https://fullnode.testnet.sui.io:443',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getObjectsOwnedByAddress',
        params: [addresses[0]],
      },
    }).then(({ data: { result } }) =>
      result.filter(
        (object) =>
          object.type ===
          '0xabf0d4e90e89c9166f81c34f3c1427a11d61964d::sui_ape::Ape'
      )
    )
    const promises = apes.map((ape) => {
      return new Promise(async (resolve) => {
        const { data } = await axios({
          method: 'POST',
          url: 'https://fullnode.testnet.sui.io:443',
          data: {
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getObject',
            params: [ape.objectId],
          },
        })
        resolve(data.result.details)
      })
    })
    const promisesResult = await Promise.all(promises)

    setAPEs(promisesResult)
  }

  const handleFetchApeFightFromPlayground = async () => {
    const addresses = await wallet?.getAccounts()
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

    const promisesCheckOwner = promisesResult
      .filter((ape) => ape.details.data.fields.owner === addresses[0])
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
    const promisesCheckOwnerResult = await Promise.all(promisesCheckOwner)

    const selfFightApes = promisesCheckOwnerResult.map((object) => {
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
        resolve(data.result.details)
      })
    })

    setArenaAPEs(await Promise.all(selfFightApes))
  }

  const handleRequestFight = async (apeId) => {
    await signAndExecuteTransaction({
      kind: 'moveCall',
      data: {
        packageObjectId: APE_PACKAGE,
        module: 'sui_ape',
        function: 'request_fight',
        typeArguments: [],
        arguments: [apeId, Playground],
        gasBudget: GAS_BUDGET,
      },
    })
  }

  const handleCancelRequestFight = async (apeId) => {
    const { data } = await axios({
      method: 'POST',
      url: 'https://fullnode.testnet.sui.io:443',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getObject',
        params: [apeId],
      },
    })

    const { data: data2 } = await axios({
      method: 'POST',
      url: 'https://fullnode.testnet.sui.io:443',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getObject',
        params: [data.result.details.owner.ObjectOwner],
      },
    })

    await signAndExecuteTransaction({
      kind: 'moveCall',
      data: {
        packageObjectId: APE_PACKAGE,
        module: 'sui_ape',
        function: 'cancel_request_fight',
        typeArguments: [],
        arguments: [data2.result.details.owner.ObjectOwner, Playground],
        gasBudget: GAS_BUDGET,
      },
    })
  }

  useEffect(() => {
    if (!wallet) return
    handleFetchApe()
    handleFetchApeFightFromPlayground()
  }, [connected])

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
            <Alert variant="primary">擁有角色</Alert>
          </h1>
          <Row xs={2} md={2} lg={4} className="g-4 mb-3">
            {APEs.map((ape) => {
              const canFight = ape.data.fields.status === 0
              const fighting = ape.data.fields.status === 1
              const rest = ape.data.fields.status === 2
              return (
                <Col key={ape.data.fields.id.id}>
                  <Card style={{ borderRadius: 30 }}>
                    <Card.Img variant="top" src={ape.data.fields.url} />
                    <Card.Body>
                      <Card.Title>
                        <a
                          target="_blank"
                          style={{ textDecoration: 'none' }}
                          href={`https://explorer.sui.io/objects/${ape.data.fields.id.id}?network=devnet`}
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
                      <Stack>
                        <Button
                          variant={
                            canFight ? 'outline-success' : 'outline-danger'
                          }
                          size="sm"
                          onClick={() =>
                            canFight
                              ? handleRequestFight(ape.data.fields.id.id)
                              : () => {}
                          }
                        >
                          {fighting
                            ? '離開競技場'
                            : canFight
                            ? '請求戰鬥'
                            : rest
                            ? '進行療傷'
                            : '陣亡'}
                        </Button>
                      </Stack>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}
          </Row>
          <h2>戰鬥中</h2>
          <Row xs={2} md={2} lg={4} className="g-4 mb-3">
            {ArenaAPEs.map((ape) => {
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
                      <Stack>
                        <Button
                          variant={'outline-danger'}
                          size="sm"
                          onClick={() =>
                            handleCancelRequestFight(ape.data.fields.id.id)
                          }
                        >
                          離開競技場
                        </Button>
                      </Stack>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}
          </Row>
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
      )}
    </>
  )
}
