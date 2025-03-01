import { compact } from 'lodash-es'
import { useChainId } from '../../../web3/hooks/useChainState'
import { JSON_PayloadInMask, ITO_Status } from '../types'
import { useAvailability } from './useAvailability'

/**
 * Fetch the red packet info from the chain
 * @param payload
 */
export function useAvailabilityComputed(payload: JSON_PayloadInMask) {
    const chainId = useChainId()
    const asyncResult = useAvailability(payload?.pid)

    const { value: availability } = asyncResult

    if (!availability)
        return {
            ...asyncResult,
            payload,
            computed: {
                canFetch: false,
                canClaim: false,
                canShare: false,
                canRefund: false,
                listOfStatus: [] as ITO_Status[],
            },
        }

    const isStarted = payload.start_time * 1000 < new Date().getTime()
    const isExpired = availability.expired
    const isCompleted = Number(availability.swapped) > 0

    return {
        ...asyncResult,
        computed: {
            canFetch: payload.chain_id === chainId,
            canClaim: isStarted && !isExpired && !isCompleted && payload.chain_id === chainId && payload.password,
            canRefund: isExpired && payload.chain_id === chainId,
            canShare: !isStarted,
            listOfStatus: compact([
                isStarted ? ITO_Status.started : ITO_Status.waited,
                isExpired ? ITO_Status.expired : undefined,
            ]),
        },
    }
}
