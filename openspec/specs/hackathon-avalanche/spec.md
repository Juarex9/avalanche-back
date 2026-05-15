# Visión del producto (SDD init)

## Narrativa

Sistema análogo a una caja con **dos candados**: uno operable por el receptor (FinNova) y otro por el regulador (CNBV). El banco (Bankaool) deposita fondos en esa caja vía app. La narrativa criptográfica de “candados” puede resolverse en **cliente/SDK**; el **contrato inteligente** actúa como **máquina de estados** y registro de verdad on-chain (el equipo se encarga de esa capa y de los despliegues).

## Actores

- **CNBV**: setup único (par de llaves); llave pública en contrato; panel de auditoría para ver montos reales de cajas que pasaron por la app.
- **Bankaool**: registro con wallet; llaves generadas automáticamente; envío de montos a FinNova.
- **FinNova**: desbloqueo de fondos **solo vía multisig institucional** (recomendación: **Safe{Wallet} / Gnosis Safe** en C-Chain); la dirección del contrato Safe es la “identidad” autorizada a ejecutar `release` en el vault. Visualización del monto (y payload de auditoría) según el diseño de cifrado / UI.

## Principios

- **Opt-in**: quien no use la app no queda cubierta por la demostración; no hay coerción.
- **Valor de pitch**: las transacciones enrutadas por la app son demostrablemente legítimas e inmanipulables respecto al modelo del SDK/cadena.

## Arquitectura on-chain y contratos (equipo)

### 1. Despliegue: C-Chain vs L1 (AvaCloud)

- **C-Chain (opción 48h)**: contratos EVM como en Ethereum/Polygon; integración rápida con librerías estándar desde backend.
- **Avalanche L1 / “Subnets” vía AvaCloud (pitch enterprise)**: red EVM **privada o permisionada** con validadores acotados (Bankaool, FinNova, CNBV u otros autorizados), sin montar nodos a mano; útil si el pitch exige **soberanía / datos regulados**.

### 2. Gas y adopción institucional (ERC-4337 / relayer)

- Bankaool y CNBV **no** deberían depender de comprar AVAX en exchange para cada auditoría o transferencia.
- **Account Abstraction (ERC-4337)** y/o **relayer / bouncer** (p. ej. OpenZeppelin Defender, Biconomy, u operado por el backend del equipo): el servicio **patrocina o reenvía** el gas; los actores **firman** (mensajes / UserOps) con su clave habitual. Objetivo de UX: **Web2.5** (firman, no “gestionan gas” como retail).

### 3. Avalanche Teleporter e ICT (Inter-Chain Token Transfer)

- Si el flujo incluye fondos o mensajes entre **una L1 del banco** y **una L1 del regulador** (o redes Avalanche distintas), usar **Teleporter** (mensajería nativa sobre **AWM** / verificación cross-chain).
- Evita depender de **bridges de terceros** típicos para la narrativa de seguridad del pitch: transferencia o prueba de colateral/mensaje **canal Avalanche nativo**.

### 4. Firmas y eficiencia de storage (EIP-712, eventos)

- **EIP-712 (typed data)**: los bancos/regulador firman estructuras legibles (p. ej. monto, contraparte, nonce); el contrato verifica con **`ecrecover`** (o equivalente) que la intención es auténtica.
- **Carga en chain vs off-chain/log**: el contrato **no** almacena blobs cifrados grandes en storage (caro en gas). Debe bastar con **hashes**, **estado del candado** / máquina de estados, y **eventos** (`emit BoxCreated(...)`, etc.) que llevan el payload o referencias; el **backend** indexa eventos y sirve material al cliente de la CNBV para descifrado/auditoría donde corresponda.

### 5. Activo y liberación: AVAX nativo + multisig FinNova (prioridad seguridad)

- **Activo**: escrow en **AVAX nativo** (`receive` / `msg.value` para abrir caja; `call{value:}` al liberar o reembolsar).
- **Política de liberación (MUST)**: ninguna EOA individual de FinNova puede mover fondos sola. El contrato `InterbankVault` (o equivalente) **solo** acepta llamadas a `release` (y variantes) cuando `msg.sender` es la **dirección del contrato multisig** de FinNova (p. ej. **Safe** desplegado en Avalanche C-Chain).
- **Por qué Safe y no multisig custom en Solidity**: en 48 h post-hackathon una empresa puede **desplegar/configurar** un Safe existente (umbrales **m-of-n**, rotación de owners, políticas internas, interfaz conocida, auditorías públicas). Reimplementar conteo de firmas on-chain es **alto riesgo** y poco diferenciador frente a estándar de industria.
- **Flujo operativo**: los firmantes de FinNova aprueban en la UI de Safe una transacción hacia el vault (`release(transferId, …)`); el Safe ejecuta como `msg.sender` y el vault transfiere AVAX al beneficiario acordado.
- **CNBV**: **no** forma parte del multisig de liberación; mantiene rol de **view key** / auditoría (lectura de material cifrado off-chain), coherente con “no mover fondos”.
- **Pitch “aplicable en 48 h”**: “Vault custom mínimo + **Safe como control de custodia del candado financiero** + relayer/4337 para gas + eventos para auditoría CNBV”.

## Separación de responsabilidades (SHOULD)

- **Contratos + despliegue + indexación de eventos / relayer**: equipo on-chain (este contexto).
- **SDK cliente “dos candados” + UI**: alineado con el producto; el contrato **no duplica** lógica que ya resuelva el SDK salvo verificación y estado mínimos acordados.

## Fuera de alcance del contrato (MAY)

- Obligar a participantes a usar solo la app (sigue siendo **opt-in** a nivel producto).
- Persistir en storage on-chain payloads cifrados completos si una alternativa por **eventos + hash** cumple verificabilidad y costo.
