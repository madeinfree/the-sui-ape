import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Head from 'next/head'
import Container from 'react-bootstrap/Container'
import Alert from 'react-bootstrap/Alert'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import Row from 'react-bootstrap/Row'
import Button from 'react-bootstrap/Button'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'

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
  const REWARD_POOL = process.env.NEXT_PUBLIC_REWARD_POOL
  const FIGHT_COIN = process.env.NEXT_PUBLIC_FIGHT_COIN
  const GAS_BUDGET = 10000

  const { connected, signAndExecuteTransaction, wallet } = useWallet()
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [ArenaApes, setArenaApes] = useState([])

  const handleFindApeFromArena = async () => {
    const { data: listing } = await axios({
      method: 'POST',
      url: 'https://fullnode.testnet.sui.io:443',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getObjectsOwnedByObject',
        params: [Playground],
      },
    })

    const playgroundDynamicFields = listing.result.map((object) => {
      return new Promise(async (resolve) => {
        const { data: properties } = await axios({
          method: 'POST',
          url: 'https://fullnode.testnet.sui.io:443',
          data: {
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getObject',
            params: [object.objectId],
          },
        })
        if (
          properties.result.status === 'Exists' &&
          properties.result.details.data.fields.owner ===
            (await wallet.getAccounts())[0]
        ) {
          resolve()
        } else {
          const { data } = await axios({
            method: 'POST',
            url: 'https://fullnode.testnet.sui.io:443',
            data: {
              jsonrpc: '2.0',
              id: 1,
              method: 'sui_getDynamicFields',
              params: [object.objectId],
            },
          })
          data.result.data[0].listing = object.objectId
          data.result.data[0].status =
            properties.result.details.data.fields.status
          resolve(data.result.data[0])
        }
      })
    })

    const fields = await Promise.all(playgroundDynamicFields)

    const areaApes = await Promise.all(
      fields
        .filter((notUndefined) => notUndefined)
        .map((field) => {
          return new Promise(async (resolve) => {
            const { data } = await axios({
              method: 'POST',
              url: 'https://fullnode.testnet.sui.io:443',
              data: {
                jsonrpc: '2.0',
                id: 1,
                method: 'sui_getObject',
                params: [field.objectId],
              },
            })
            data.result.details.listing = field.listing
            resolve(data.result.details)
          })
        })
    )
    setArenaApes(areaApes)
  }

  useEffect(() => {
    if (!wallet) return
    handleFindApeFromArena()
  }, [connected])

  const handleFight = async (opponent) => {
    try {
      await signAndExecuteTransaction({
        kind: 'moveCall',
        data: {
          packageObjectId: APE_PACKAGE,
          module: 'sui_ape',
          function: 'fight',
          typeArguments: [`${FIGHT_COIN}::fightcoin::FIGHTCOIN`],
          arguments: [
            Playground,
            '0xbfd2a88dc6181137869a51b3f265e32fcd0415d4',
            opponent,
            REWARD_POOL,
          ],
          gasBudget: GAS_BUDGET,
        },
      })
    } catch (err) {
      setErrorMessage(err.message)
      setShowError(true)
    }
  }

  return (
    <>
      <ToastContainer className="p-3" position="top-end">
        <Toast
          onClose={() => setShowError(false)}
          show={showError}
          delay={3000}
          autohide
        >
          <Toast.Header closeButton={false}>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong className="me-auto">發生錯誤</strong>
          </Toast.Header>
          <Toast.Body>{errorMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
      {connected ? (
        <Container>
          <h1
            style={{
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            <Alert variant="primary">天空競技場</Alert>
          </h1>
          <Row xs={2} md={2} lg={4} className="g-4 mb-3">
            {ArenaApes.map((ape) => {
              const canFight = ape.stauts === 1
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
                      <Button
                        onClick={
                          canFight ? () => handleFight(ape.listing) : null
                        }
                        disabled={!canFight}
                        variant={'outline-danger'}
                        size="sm"
                      >
                        {canFight ? '發起戰鬥' : '無法戰鬥'}
                      </Button>
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
