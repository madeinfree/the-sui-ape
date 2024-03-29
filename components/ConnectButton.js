import Button from 'react-bootstrap/Button'
import { useWallet } from '@mysten/wallet-adapter-react'

export default function Mint() {
  const { wallets, connected, select, disconnect } = useWallet()

  const handleConnectSuiWallet = (walletName) => {
    select(walletName)
  }

  const handleDisconnectWallet = () => {
    disconnect()
  }

  return (
    <>
      {connected ? (
        <Button onClick={handleDisconnectWallet}>Disconnect</Button>
      ) : (
        wallets
          // .filter((w) => w.name === 'Sui Wallet')
          .map((wallet) => (
            <Button
              key={wallet.name}
              onClick={() => handleConnectSuiWallet(wallet.name)}
            >
              Connect Wallet
              <img
                src="https://sui.io/favicon.png"
                style={{
                  width: '1.5em',
                  verticalAlign: 'top',
                  marginLeft: '0.5em',
                }}
              />
            </Button>
          ))
      )}
    </>
  )
}
