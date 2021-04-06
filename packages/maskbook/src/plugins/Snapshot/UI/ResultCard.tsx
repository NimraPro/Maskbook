import { useContext, useRef, useEffect, useState, useMemo } from 'react'
import classNames from 'classnames'
import {
    Card,
    createStyles,
    makeStyles,
    CardContent,
    CardHeader,
    Box,
    List,
    ListItem,
    Typography,
    LinearProgress,
    withStyles,
    Button,
} from '@material-ui/core'
import { ShadowRootTooltip } from '../../../utils/shadow-root/ShadowRootComponents'
import millify from 'millify'
import { SnapshotContext } from '../context'
import { useI18N } from '../../../utils/i18n-next-ui'
import { useProposal } from '../hooks/useProposal'
import { useVotes } from '../hooks/useVotes'
import { useResults } from '../hooks/useResults'
import { parse } from 'json2csv'

const choiceMaxWidth = 240

const useStyles = makeStyles((theme) => {
    return createStyles({
        root: {
            margin: '16px auto',
            border: `solid 1px ${theme.palette.divider}`,
            padding: 0,
            minHeight: 320,
        },
        content: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 !important',
        },
        header: {
            backgroundColor: theme.palette.mode === 'dark' ? '#24292e' : 'white',
            borderBottom: `1px solid ${theme.palette.divider}`,
            padding: '12px 16px',
        },
        title: {
            paddingLeft: theme.spacing(1),
            fontSize: 20,
        },
        list: {
            display: 'flex',
            flexDirection: 'column',
        },
        listItem: {
            display: 'flex',
            flexDirection: 'column',
        },
        listItemHeader: {
            display: 'flex',
            width: '100%',
        },
        power: {
            marginLeft: theme.spacing(2),
        },
        ratio: {
            marginLeft: 'auto',
        },
        choice: {
            maxWidth: choiceMaxWidth,
        },
        linearProgressWrap: {
            width: '100%',
            marginTop: theme.spacing(1),
        },
        ellipsisText: {
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
        },
        resultButton: {
            width: 200,
            margin: '0 auto',
        },
    })
})

const StyledLinearProgress = withStyles({
    root: {
        height: 8,
        borderRadius: 5,
    },
    bar: {
        borderRadius: 5,
    },
})(LinearProgress)

export function ResultCard() {
    const identifier = useContext(SnapshotContext)
    const {
        payload: { proposal, message },
    } = useProposal(identifier.id)
    const { payload: votes } = useVotes(identifier)
    const {
        payload: { results },
    } = useResults(identifier)
    const classes = useStyles()
    const { t } = useI18N()
    const listRef = useRef<HTMLSpanElement[]>([])
    const [tooltipVisibles, setTooltipVisibles] = useState<boolean[]>(new Array(results.length).fill(false))

    useEffect(() => {
        setTooltipVisibles(listRef.current.map((element) => (element.offsetWidth === choiceMaxWidth ? true : false)))
    }, [])
    console.log({ results })

    const dataForCsv = useMemo(
        () =>
            Object.entries(votes).map((vote) => ({
                address: vote[0],
                choice: vote[1].msg.payload.choice,
                balance: vote[1].balance,
                timestamp: vote[1].msg.timestamp,
                dateUtc: new Date(parseInt(vote[1].msg.timestamp) * 1e3).toUTCString(),
                authorIpfsHash: vote[1].authorIpfsHash,
                relayerIpfsHash: vote[1].relayerIpfsHash,
            })),
        [votes],
    )

    return (
        <Card className={classes.root} elevation={0}>
            <CardHeader
                className={classes.header}
                title={
                    <Box className={classes.title}>
                        {proposal.isEnd ? t('plugin_snapshot_result_title') : t('plugin_snapshot_current_result_title')}
                    </Box>
                }></CardHeader>
            <CardContent className={classes.content}>
                <List className={classes.list}>
                    {results.map((result, i) => (
                        <ListItem className={classes.listItem} key={i.toString()}>
                            <Box className={classes.listItemHeader}>
                                <ShadowRootTooltip
                                    PopperProps={{
                                        disablePortal: true,
                                    }}
                                    title={<Typography color="textPrimary">{result.choice}</Typography>}
                                    placement="top"
                                    disableHoverListener={!tooltipVisibles[i]}
                                    arrow>
                                    <Typography
                                        ref={(ref) => {
                                            listRef.current[i] = ref!
                                        }}
                                        className={classNames(classes.choice, classes.ellipsisText)}>
                                        {result.choice}
                                    </Typography>
                                </ShadowRootTooltip>
                                <ShadowRootTooltip
                                    PopperProps={{
                                        disablePortal: true,
                                    }}
                                    title={
                                        <Typography color="textPrimary" className={classes.ellipsisText}>
                                            {result.powerDetail.reduce((sum, cur, i) => {
                                                return `${sum} ${i === 0 ? '' : '+'} ${
                                                    millify(cur.power, { precision: 2, lowercase: true }) +
                                                    ' ' +
                                                    cur.name
                                                }`
                                            }, '')}
                                        </Typography>
                                    }
                                    placement="top"
                                    arrow>
                                    <Typography className={classes.power}>
                                        {millify(result.power, { precision: 2, lowercase: true })}
                                    </Typography>
                                </ShadowRootTooltip>
                                <Typography className={classes.ratio}>
                                    {parseFloat(result.percentage.toFixed(2))}%
                                </Typography>
                            </Box>
                            <Box className={classes.linearProgressWrap}>
                                <StyledLinearProgress variant="determinate" value={result.percentage} />
                            </Box>
                        </ListItem>
                    ))}
                </List>
                {proposal.isEnd ? (
                    <Button
                        color="primary"
                        variant="outlined"
                        className={classes.resultButton}
                        onClick={() => {
                            const csv = parse(dataForCsv)
                            const link = document.createElement('a')
                            link.setAttribute('href', `data:text/csv;charset=utf-8,${csv}`)
                            link.setAttribute('download', `snapshot-report-${identifier.id}.csv`)
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                        }}>
                        {t('plugin_snapshot_download_report')}
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    )
}
