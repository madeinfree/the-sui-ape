import { useState, useEffect } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'

import { useWallet } from '@mysten/wallet-adapter-react'

const MintDynamic = dynamic(() => import('../components/ConnectButton'), {
  ssr: false,
})

export default () => {
  const { connected, disconnect, wallet } = useWallet()
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (connected) {
      axios({
        method: 'POST',
        url: 'https://fullnode.testnet.sui.io:443',
        data: {
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_getBalance',
          params: [
            wallet.wallet.accounts[0].address,
            `${process.env.NEXT_PUBLIC_FIGHT_COIN}::fightcoin::FIGHTCOIN`,
          ],
        },
      }).then((res) => {
        setBalance(res.data.result.totalBalance)
      })
    }
  }, [connected])

  return (
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
          {!connected ? (
            <MintDynamic />
          ) : (
            <NavDropdown title="Setting" id="basic-nav-dropdown">
              <NavDropdown.Item>
                {(Number(balance) / 100).toLocaleString()} FIGHT
              </NavDropdown.Item>
              <NavDropdown.Item>
                <div onClick={disconnect}>Disconnect</div>
              </NavDropdown.Item>
            </NavDropdown>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
