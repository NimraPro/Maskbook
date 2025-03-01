import { useState } from 'react'
import {
    Box,
    Button,
    IconButton,
    createStyles,
    makeStyles,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Theme,
    Typography,
} from '@material-ui/core'
import BigNumber from 'bignumber.js'
import classNames from 'classnames'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { useStylesExtends } from '../../../components/custom-ui-helper'
import { formatBalance, formatCurrency } from '../../../plugins/Wallet/formatter'
import { useI18N } from '../../../utils/i18n-next-ui'
import { CurrencyType, ERC20TokenDetailed, EthereumTokenType } from '../../../web3/types'
import { isSameAddress } from '../../../web3/helpers'
import { TokenIcon } from './TokenIcon'
import type { WalletRecord } from '../../../plugins/Wallet/database/types'
import { ActionsBarFT } from './ActionsBarFT'
import { useTrustedERC20TokensFromDB } from '../../../plugins/Wallet/hooks/useERC20Tokens'
import { useStableTokensDebank } from '../../../web3/hooks/useStableTokensDebank'
import type { Asset } from '../../../plugins/Wallet/types'
import { getTokenUSDValue } from '../../../plugins/Wallet/helpers'
import { useAssets } from '../../../plugins/Wallet/hooks/useAssets'
import { useMatchXS } from '../../../utils/hooks/useMatchXS'

const useStyles = makeStyles((theme: Theme) =>
    createStyles<string, { isMobile: boolean }>({
        container: {
            '&::-webkit-scrollbar': {
                display: 'none',
            },
            padding: theme.spacing(0),
        },
        table: {},
        head: {
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.common.white : 'var(--drawerBody)',
        },
        cell: {
            paddingLeft: ({ isMobile }) => (isMobile ? theme.spacing(0.5) : theme.spacing(2)),
            paddingRight: ({ isMobile }) => (isMobile ? theme.spacing(0.5) : theme.spacing(1.5)),
            fontSize: ({ isMobile }) => (isMobile ? '0.8rem' : '0.875rem'),
            whiteSpace: 'nowrap',
        },
        record: {
            display: 'flex',
        },
        coin: {
            width: ({ isMobile }) => (isMobile ? 20 : 24),
            height: ({ isMobile }) => (isMobile ? 20 : 24),
        },
        name: {
            marginLeft: theme.spacing(1),
            fontSize: ({ isMobile }) => (isMobile ? '0.9rem' : '1rem'),
        },
        price: {
            fontSize: ({ isMobile }) => (isMobile ? '0.9rem' : '1rem'),
        },
        more: {
            color: theme.palette.text.primary,
            fontSize: ({ isMobile }) => (isMobile ? '0.9rem' : '1rem'),
        },
        lessButton: {
            display: 'flex',
            justifyContent: 'center',
            marginTop: theme.spacing(1),
        },
        menuAnchorElRef: {},
    }),
)

//#region view detailed
interface ViewDetailedProps extends WalletAssetsTableProps {
    asset: Asset
}

function ViewDetailed(props: ViewDetailedProps) {
    const { wallet, asset: x } = props

    const isMobile = useMatchXS()
    const classes = useStylesExtends(useStyles({ isMobile }), props)
    const stableTokens = useStableTokensDebank()

    return (
        <TableRow className={classes.cell} key={x.token.address}>
            {[
                <Box
                    sx={{
                        display: 'flex',
                    }}>
                    <TokenIcon classes={{ icon: classes.coin }} name={x.token.name} address={x.token.address} />
                    <Typography className={classes.name}>{x.token.symbol}</Typography>
                </Box>,
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}>
                    <Typography className={classes.price} color="textPrimary" component="span">
                        {x.price?.[CurrencyType.USD]
                            ? formatCurrency(Number.parseFloat(x.price[CurrencyType.USD]), '$')
                            : '-'}
                    </Typography>
                </Box>,
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}>
                    <Typography className={classes.name} color="textPrimary" component="span">
                        {new BigNumber(
                            formatBalance(new BigNumber(x.balance), x.token.decimals ?? 0, x.token.decimals ?? 0),
                        ).toFixed(
                            stableTokens.some((y: ERC20TokenDetailed) => isSameAddress(y.address, x.token.address))
                                ? 2
                                : 6,
                        )}
                    </Typography>
                </Box>,
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}>
                    <Typography className={classes.price} color="textPrimary" component="span">
                        {formatCurrency(Number(getTokenUSDValue(x).toFixed(2)), '$')}
                    </Typography>
                </Box>,
                ...(isMobile
                    ? []
                    : [
                          <Box
                              sx={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                              }}>
                              <ActionsBarFT chain={x.chain} wallet={wallet} token={x.token} />
                          </Box>,
                      ]),
            ]
                .filter(Boolean)
                .map((y, i) => (
                    <TableCell className={classes.cell} key={i}>
                        {y}
                    </TableCell>
                ))}
        </TableRow>
    )
}
//#endregion

//#region wallet asset table
const MIN_VALUE = 5

export interface WalletAssetsTableProps extends withClasses<never> {
    wallet: WalletRecord
}

export function WalletAssetsTable(props: WalletAssetsTableProps) {
    const { t } = useI18N()
    const { wallet } = props

    const isMobile = useMatchXS()
    const classes = useStylesExtends(useStyles({ isMobile }), props)
    const LABELS = [
        t('wallet_assets'),
        t('wallet_price'),
        t('wallet_balance'),
        t('wallet_value'),
        ...(isMobile ? [] : ['']),
    ] as const

    const erc20Tokens = useTrustedERC20TokensFromDB()
    const {
        value: detailedTokens,
        error: detailedTokensError,
        loading: detailedTokensLoading,
        retry: detailedTokensRetry,
    } = useAssets(erc20Tokens)

    const [more, setMore] = useState(false)

    if (detailedTokensError)
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                }}>
                <Typography color="textSecondary">No token found.</Typography>
                <Button
                    sx={{
                        marginTop: 1,
                    }}
                    variant="text"
                    onClick={() => detailedTokensRetry()}>
                    Retry
                </Button>
            </Box>
        )

    if (!detailedTokens.length) return null

    const viewDetailedTokens = detailedTokens.filter(
        (x) =>
            new BigNumber(x.value?.[CurrencyType.USD] || '0').isGreaterThan(MIN_VALUE) ||
            x.token.type === EthereumTokenType.Ether,
    )

    return (
        <>
            <TableContainer className={classes.container}>
                <Table className={classes.table} component="table" size="medium" stickyHeader>
                    <TableHead className={classes.head}>
                        <TableRow>
                            {LABELS.map((x, i) => (
                                <TableCell
                                    className={classNames(classes.head, classes.cell)}
                                    key={i}
                                    align={i === 0 ? 'left' : 'right'}>
                                    {x}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {detailedTokensLoading
                            ? new Array(3).fill(0).map((_, i) => (
                                  <TableRow className={classes.cell} key={i}>
                                      <TableCell>
                                          <Skeleton
                                              animation="wave"
                                              variant="rectangular"
                                              width="100%"
                                              height={30}></Skeleton>
                                      </TableCell>
                                      <TableCell>
                                          <Skeleton
                                              animation="wave"
                                              variant="rectangular"
                                              width="100%"
                                              height={30}></Skeleton>
                                      </TableCell>
                                      <TableCell>
                                          <Skeleton
                                              animation="wave"
                                              variant="rectangular"
                                              width="100%"
                                              height={30}></Skeleton>
                                      </TableCell>
                                      <TableCell>
                                          <Skeleton
                                              animation="wave"
                                              variant="rectangular"
                                              width="100%"
                                              height={30}></Skeleton>
                                      </TableCell>
                                      <TableCell>
                                          <Skeleton
                                              animation="wave"
                                              variant="rectangular"
                                              width="100%"
                                              height={30}></Skeleton>
                                      </TableCell>
                                  </TableRow>
                              ))
                            : (more ? detailedTokens : viewDetailedTokens).map((y, idx) => (
                                  <ViewDetailed key={idx} asset={y} wallet={wallet} />
                              ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {viewDetailedTokens.length < detailedTokens.length ? (
                <div className={classes.lessButton}>
                    <IconButton
                        size="small"
                        onClick={() => {
                            setMore(!more)
                        }}>
                        {more ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </div>
            ) : null}
        </>
    )
}
//#endregion
