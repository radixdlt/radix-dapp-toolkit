# Radix dApp Toolkit internal modules

```mermaid
flowchart TD
    %% Main Entry
    M[dApp toolkit modules]

    %% Core Modules with Implementation Files
    M ---> WR[Wallet Request]
    M ---> S[Storage]
    M ---> E[Environment]
    M ---> CB[Connect Button]
    M ---> G[Gateway]
    M ---> ST[State]

    %% Wallet Request Components
    WR ---> WRC1[data-request]
    WR ---> WRC2[pre-authorization-request]
    WR ---> WRC3[session]
    WR ---> WRC4[identity]
    WR ---> WRC5[encryption]
    WR ---> WRC7[Transport]
    WR ---> WRC8[request-resolver]
    WR ---> WRC9[request-items]

    %% Transport Submodules
    WRC7 ---> T1[radix-connect-relay]
    WRC7 ---> T2[connector-extension]

    %% Style Definitions
    classDef mainModule fill:#282a36,stroke:#ff79c6,stroke-width:2px,color:#f8f8f2,font-family:Monaco,font-weight:bold,font-size:14px;
    classDef implementation fill:#44475a,stroke:#8be9fd,stroke-width:1px,color:#50fa7b,font-family:Monaco,font-size:12px;
    classDef space fill:none,stroke:none;

    %% Class Assignments
    class WR,S,E,CB,G,ST mainModule;
    class WRC1,WRC2,WRC3,WRC4,WRC5,WRC7,WRC8,WRC9 implementation;
    class T1,T2,T3 implementation;

    %% Link Styling
    linkStyle default stroke:#bd93f9,stroke-width:2px;
```

### Wallet Request

The central module for handling all wallet-related interactions. It coordinates communication between the dApp and the Radix Wallet through various submodules:

- **data-request**: Manages data requests to and from the wallet
- **pre-authorization-request**: Handles wallet pre-authorization requests
- **session**: Manages wallet connection sessions
- **identity**: Handles user identity in context of wallet sessions
- **encryption**: Provides encryption services for secure communication
- **transport**: Manages different transport layers for wallet communication
- **request-resolver**: Matches outgoing requests to incoming responses
- **request-items**: Internal record of all requests

#### Transport Layer

The transport module supports multiple communication channels:

- **radix-connect-relay**: Handles communication through deep link and the Radix Connect relay service
- **connector-extension**: Manages browser extension-based connections

### Storage

Manages persistent data storage for the dApp, handling:

- Wallet connection states
- Session information
- Cache management

### Environment

Handles environment-specific configuration and detection:

- Platform-specific features
- Runtime configuration
- Environment-specific optimizations

### Connect Button

Provides the UI component for wallet connection:

- User interface for wallet connection
- Connection state management
- Visual feedback for connection states
- Customizable styling and behavior

### Gateway

Manages communication with the Radix Gateway:

- API endpoint management
- Transaction status polling

### State

Manages the global state of the dApp toolkit:

- Connection state
- Wallet state
- Request states
- Event management
