import { err, okAsync, ResultAsync } from 'neverthrow'
import {
  WalletInteraction,
  WalletInteractionResponse,
} from '../../../../schemas'
import {
  transformWalletRequestToSharedData,
  transformWalletResponseToRdtWalletData,
  WalletDataRequestResponse,
} from '../../data-request'
import { RequestItemModule } from '../../request-items'
import { StateModule, WalletData } from '../../../state'
import { SdkError } from '../../../../error'
import { UpdateConnectButtonStatus, WalletResponseResolver } from '../type'
import { RequestItem } from 'radix-connect-common'

const matchResponse = (
  input: WalletInteractionResponse,
): WalletDataRequestResponse | undefined => {
  if (input.discriminator === 'success') {
    if (
      input.items.discriminator === 'authorizedRequest' ||
      input.items.discriminator === 'unauthorizedRequest'
    ) {
      return input.items
    }
  }
}

type GetDataRequestController = () =>
  | undefined
  | ((
      walletData: WalletData,
    ) => ResultAsync<any, { error: string; message: string }>)

const useDataRequestController =
  (getDataRequestController: GetDataRequestController, interactionId: string) =>
  (walletData: WalletData) => {
    const maybeDataRequestController = getDataRequestController()

    if (!maybeDataRequestController) return okAsync(walletData)

    return maybeDataRequestController(walletData)
      .map(() => walletData)
      .mapErr((error) => SdkError(error.error, interactionId, error.message))
  }

const handleAuthorizedRequestResponse = ({
  requestItem,
  walletInteraction,
  walletData,
  stateModule,
}: {
  requestItem: RequestItem
  walletInteraction: WalletInteraction
  walletData: WalletData
  stateModule: StateModule
}) =>
  stateModule
    .getState()
    .andThen((state) =>
      stateModule
        .setState({
          loggedInTimestamp:
            requestItem.type === 'loginRequest'
              ? Date.now().toString()
              : state!.loggedInTimestamp,
          walletData,
          sharedData: transformWalletRequestToSharedData(
            walletInteraction,
            state!.sharedData,
          ),
        })
        .andTee(() => stateModule.emitWalletData()),
    )
    .orElse(() =>
      err(SdkError('FailedToUpdateRdtState', walletInteraction.interactionId)),
    )

export const dataResponseResolver =
  (dependencies: {
    requestItemModule: RequestItemModule
    getDataRequestController: GetDataRequestController
    stateModule: StateModule
    updateConnectButtonStatus: UpdateConnectButtonStatus
  }): WalletResponseResolver =>
  ({ walletInteraction, walletInteractionResponse, requestItem }) => {
    const dataResponse = matchResponse(walletInteractionResponse)
    if (!dataResponse) return okAsync(undefined)

    const { requestItemModule, getDataRequestController, stateModule } =
      dependencies

    const { interactionId } = walletInteraction

    return transformWalletResponseToRdtWalletData(dataResponse)
      .andThen(
        useDataRequestController(getDataRequestController, interactionId),
      )
      .andThen((walletData) =>
        dataResponse.discriminator === 'authorizedRequest'
          ? handleAuthorizedRequestResponse({
              requestItem,
              walletInteraction,
              walletData,
              stateModule,
            }).map(() => walletData)
          : okAsync(walletData),
      )
      .andThen((walletData) =>
        requestItemModule
          .updateStatus({
            id: walletInteraction.interactionId,
            status: 'success',
            walletData,
            walletResponse: walletInteractionResponse,
          })
          .mapErr((error) =>
            SdkError(error.reason, walletInteraction.interactionId),
          ),
      )
      .andTee(() => dependencies.updateConnectButtonStatus('success'))
      .orElse((error) => {
        dependencies.updateConnectButtonStatus('fail')
        return err(error)
      })
      .map(() => undefined)
  }
