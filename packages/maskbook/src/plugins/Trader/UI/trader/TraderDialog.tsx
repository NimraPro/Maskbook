import { useCallback } from 'react'
import { DialogContent } from '@material-ui/core'
import { InjectedDialog } from '../../../../components/shared/InjectedDialog'
import { useRemoteControlledDialog } from '../../../../utils/hooks/useRemoteControlledDialog'
import { PluginTraderMessages } from '../../messages'
import { Trader } from './Trader'

export function TraderDialog() {
    const [open, setOpen] = useRemoteControlledDialog(PluginTraderMessages.events.SwapDialogUpdated)
    const onClose = useCallback(() => {
        setOpen({
            open: false,
        })
    }, [])
    return (
        <InjectedDialog open={open} onClose={onClose}>
            <DialogContent>
                <Trader coin={{ id: 'n/a', symbol: 'n/a', name: 'n/a' }}></Trader>
            </DialogContent>
        </InjectedDialog>
    )
}
