import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, Skeleton, Stack, Chip, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminService } from '../../services/admin';
import fieldsService from '../../services/fields';
import { orderService } from '../../services/orders';
import supabase from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import EnhancedFarmMap from '../../components/Map/EnhancedFarmMap';
import { getProductIcon } from '../../utils/productIcons';
import { DonutSmall, LocalFlorist, Public, NotificationsNone, ReportProblemOutlined, ReceiptLong, HowToReg, MapOutlined, ShowChart, PieChartOutline, ArrowUpward, ArrowDownward } from '@mui/icons-material';

const sectionGap = { xs: 2, sm: 3 };
const pageSizes = { complaints: 3, transactions: 7, approvals: 4 };
const cardSx = { borderRadius: 3, boxShadow: '0 6px 22px rgba(0,0,0,0.08)' };
const cardContentSx = { p: { xs: 2, sm: 2.5 } };
const cardTitleSx = { fontWeight: 800, color: 'text.primary' };
const tableHeadCellSx = { fontWeight: 800, color: 'text.primary' };
const tableBodyCellSx = { py: 0.75 };
const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statTone = (key) => {
  switch (key) {
    case 'green':
      return { accent: 'rgba(34,197,94,0.14)', iconColor: 'rgba(21,128,61,0.95)' };
    case 'orange':
      return { accent: 'rgba(249,115,22,0.14)', iconColor: 'rgba(234,88,12,0.95)' };
    case 'purple':
      return { accent: 'rgba(168,85,247,0.14)', iconColor: 'rgba(126,34,206,0.95)' };
    case 'cyan':
      return { accent: 'rgba(96,165,250,0.16)', iconColor: 'rgba(37,99,235,0.95)' };
    case 'teal':
      return { accent: 'rgba(20,184,166,0.14)', iconColor: 'rgba(13,148,136,0.95)' };
    default:
      return { accent: 'rgba(99,102,241,0.12)', iconColor: 'rgba(99,102,241,0.95)' };
  }
};

const StatCard = ({ title, value, loading, color, icon: Icon }) => {
  const tone = statTone(color);
  return (
    <Card sx={{ ...cardSx, bgcolor: 'background.paper' }}>
      <CardContent sx={{ p: { xs: 1.25, sm: 1.5 } }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 3,
              bgcolor: tone.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ color: tone.iconColor, fontSize: 20 }} />
          </Box>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 800 }}>{title}</Typography>
        </Stack>
        <Box sx={{ mt: 0.75, mb: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <Skeleton variant="text" width={90} height={36} />
          ) : (
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', textAlign: 'center' }}>{value}</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const CardHeader = ({ title, subtitle }) => (
  <Stack direction="row" spacing={1} alignItems="baseline" justifyContent="space-between">
    <Typography variant="h6" sx={cardTitleSx}>{title}</Typography>
    {subtitle ? <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{subtitle}</Typography> : null}
  </Stack>
);

const EmptyState = ({ icon: Icon, title, subtitle, compact = false, accent = 'rgba(99,102,241,0.12)', iconColor = 'rgba(99,102,241,0.95)' }) => (
  <Box
    sx={{
      flex: 1,
      minHeight: compact ? 110 : 160,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      px: 2,
      py: compact ? 2 : 3,
    }}
  >
    <Stack spacing={compact ? 0.5 : 0.75} alignItems="center">
      <Box
        sx={{
          width: compact ? 42 : 50,
          height: compact ? 42 : 50,
          borderRadius: 3,
          bgcolor: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon sx={{ color: iconColor, fontSize: compact ? 22 : 26 }} />
      </Box>
      <Typography variant={compact ? 'subtitle2' : 'subtitle1'} sx={{ fontWeight: 900, lineHeight: 1.2 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>{subtitle}</Typography>
    </Stack>
  </Box>
);

const TableEmptyRow = ({ colSpan, icon, title, subtitle }) => (
  <TableRow>
    <TableCell colSpan={colSpan} sx={{ py: 2 }}>
      <EmptyState icon={icon} title={title} subtitle={subtitle} compact />
    </TableCell>
  </TableRow>
);

const DonutChart = ({ segments }) => {
  const theme = useTheme();
  const palette = [
    '#fdbA74',
    '#2bb673',
    '#fca5a5',
    '#fecf8f',
    '#5b8def',
    '#cbd5e1',
    '#3dcf86',
    '#4f83e1',
    '#fed7d7',
    '#199e61'
  ];
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const ordered = [...segments].sort((a, b) => b.value - a.value).map((s, i) => ({ ...s, color: s.color || palette[i % palette.length] }));
  const withPct = ordered.map(s => ({ ...s, pct: Math.round((s.value / total) * 100) }));
  const display = withPct.filter(s => s.pct > 0);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, label: '', pct: 0 });
  let acc = 0;
  const w = 240;
  const h = 180;
  const cx = 90;
  const cy = 90;
  const radius = 66;
  const inner = 48;
  const paths = display.map((seg, idx) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const end = ((acc + seg.value) / total) * Math.PI * 2 - Math.PI / 2;
    acc += seg.value;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const x3 = cx + inner * Math.cos(end);
    const y3 = cy + inner * Math.sin(end);
    const x4 = cx + inner * Math.cos(start);
    const y4 = cy + inner * Math.sin(start);
    const largeArc = end - start > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    return { d, color: seg.color, label: seg.label, pct: seg.pct, idx };
  });
  const active = hoverIdx != null ? display[hoverIdx] : null;
  const legendBase = withPct.map((p, i) => ({ ...p, color: palette[i % palette.length] }));
  const legend = legendBase.map((p) => (p.pct === 0 ? { ...p, color: '#e5e7eb' } : p));
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
      <Box sx={{ width: 240, height: 180, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {paths.map((p) => (
            <path
              key={p.idx}
              d={p.d}
              fill={p.color}
              opacity={hoverIdx != null ? (p.idx === hoverIdx ? 1 : 0.55) : 1}
              transform={hoverIdx === p.idx ? `translate(${cx} ${cy}) scale(1.035) translate(${-cx} ${-cy})` : undefined}
              onMouseEnter={(e) => {
                setHoverIdx(p.idx);
                const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                setTooltip({ visible: true, x: mx, y: my, label: p.label, pct: p.pct });
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                setTooltip((t) => ({ ...t, x: mx, y: my }));
              }}
              onMouseLeave={() => {
                setHoverIdx(null);
                setTooltip({ visible: false, x: 0, y: 0, label: '', pct: 0 });
              }}
            />
          ))}
          <circle cx={cx} cy={cy} r={inner} fill={theme.palette.background.paper} />
          {active ? (
            <g>
              <text x={cx} y={cy - 4} fontSize="14" textAnchor="middle" fill={theme.palette.text.primary} fontWeight="900">{active.label}</text>
              <text x={cx} y={cy + 14} fontSize="12" textAnchor="middle" fill={theme.palette.text.secondary} fontWeight="800">{`${active.pct}%`}</text>
            </g>
          ) : (
            <g>
              <text x={cx} y={cy + 4} fontSize="12" textAnchor="middle" fill={theme.palette.text.secondary} fontWeight="800">Crops</text>
            </g>
          )}
        </svg>
        {tooltip.visible ? (
          <Box
            sx={{
              position: 'absolute',
              left: `${tooltip.x + 8}px`,
              top: `${tooltip.y + 8}px`,
              bgcolor: 'background.paper',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              borderRadius: 1,
              px: 1,
              py: 0.5,
              pointerEvents: 'none',
              boxShadow: 'none',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>{tooltip.label}</Typography>
            <Typography variant="caption" sx={{ ml: 0.75, color: 'text.secondary', fontWeight: 700 }}>{tooltip.pct}%</Typography>
          </Box>
        ) : null}
      </Box>
      <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1, alignSelf: 'stretch', maxHeight: 160, overflowY: 'auto', pr: 0.5 }}>
        {legend.map((p, i) => (
          <Stack key={i} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ opacity: p.pct === 0 ? 0.35 : 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              <span style={{ width: 10, height: 10, background: p.color, borderRadius: '50%', display: 'inline-block' }} />
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', minWidth: 0, wordBreak: 'break-word' }}>{p.label}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, flexShrink: 0 }}>{p.pct}%</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

const LineChart = ({ points, color = '#22c55e', tooltipExtraMap = {}, secondaryPoints = null, secondaryColor = '#5b8def', yAxisLabel = 'Transactions (count per day)', xAxisLabel = 'Date', smooth = false, areaGradient = true, tooltipUnitLabel = 'tx' }) => {
  const w = 360;
  const h = 160;
  const m = { top: 8, right: 8, bottom: 28, left: 28 };
  const innerW = w - m.left - m.right;
  const innerH = h - m.top - m.bottom;
  const maxY = Math.max(...points.map(p => p.y), 0);
  const maxY2 = secondaryPoints ? Math.max(...secondaryPoints.map(p => p.y), 0) : 0;
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const toX = (i) => m.left + i * step;
  const toY = (v) => m.top + (innerH - (v / Math.max(maxY, 1)) * innerH);
  const toY2 = (v) => m.top + (innerH - (v / Math.max(maxY2, 1)) * innerH);
  const xCoords = points.map((_, i) => toX(i));
  const yCoords = points.map((p) => toY(p.y));
  const makeSmoothPath = () => {
    if (points.length < 2) return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.y)}`).join(' ');
    const segs = [`M ${xCoords[0]} ${yCoords[0]}`];
    for (let i = 1; i < points.length; i += 1) {
      const x0 = xCoords[i - 2] ?? xCoords[i - 1];
      const y0 = yCoords[i - 2] ?? yCoords[i - 1];
      const x1 = xCoords[i - 1];
      const y1 = yCoords[i - 1];
      const x2 = xCoords[i];
      const y2 = yCoords[i];
      const x3 = xCoords[i + 1] ?? xCoords[i];
      const y3 = yCoords[i + 1] ?? yCoords[i];
      const c1x = x1 + (x2 - x0) / 6;
      const c1y = y1 + (y2 - y0) / 6;
      const c2x = x2 - (x3 - x1) / 6;
      const c2y = y2 - (y3 - y1) / 6;
      segs.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`);
    }
    return segs.join(' ');
  };
  const path = smooth ? makeSmoothPath() : points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.y)}`).join(' ');
  const path2 = secondaryPoints ? secondaryPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY2(p.y)}`).join(' ') : null;
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }).map((_, i) => Math.round((i * Math.max(maxY, 1)) / ticks));
  const xLabels = points.map(p => p.x).filter((_, i) => i % Math.ceil(points.length / 6 || 1) === 0);
  const [hover, setHover] = useState(null);
  const nearestIndex = (mx) => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < xCoords.length; i += 1) {
      const d = Math.abs(xCoords[i] - mx);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  };
  return (
    <svg width={w} height={h}>
      {areaGradient || secondaryPoints ? (
        <defs>
          {areaGradient ? (
            <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          ) : null}
          {secondaryPoints ? (
            <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.10" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
            </linearGradient>
          ) : null}
        </defs>
      ) : null}
      <rect x={m.left} y={m.top} width={innerW} height={innerH} fill="none" />
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={m.left} y1={toY(t)} x2={m.left + innerW} y2={toY(t)} stroke="#e2e8f0" strokeDasharray="4 4" />
          <text x={m.left - 8} y={toY(t) + 3} fontSize="10" textAnchor="end" fill="#64748b">{t}</text>
        </g>
      ))}
      <path d={path} stroke={color} strokeWidth="2.5" fill="none" />
      {areaGradient ? (
        <path d={`${path} L ${m.left + innerW} ${m.top + innerH} L ${m.left} ${m.top + innerH} Z`} fill="url(#lg)" />
      ) : (
        <path d={`${path} L ${m.left + innerW} ${m.top + innerH} L ${m.left} ${m.top + innerH} Z`} fill={color} opacity="0.12" />
      )}
      {secondaryPoints ? (
        <>
          <path d={path2} stroke={secondaryColor} strokeWidth="2" fill="none" />
          <path d={`${path2} L ${m.left + innerW} ${m.top + innerH} L ${m.left} ${m.top + innerH} Z`} fill="url(#lg2)" />
        </>
      ) : null}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={toX(i)}
          cy={toY(p.y)}
          r={hover === i ? 3.8 : 2.8}
          fill={color}
          opacity={hover != null && hover !== i ? 0.5 : 1}
          pointerEvents="none"
        />
      ))}
      {secondaryPoints ? secondaryPoints.map((p, i) => (
        <circle
          key={`s-${i}`}
          cx={toX(i)}
          cy={toY2(p.y)}
          r={hover === i ? 3.2 : 2.6}
          fill={secondaryColor}
          opacity={hover != null && hover !== i ? 0.5 : 0.9}
          pointerEvents="none"
        />
      )) : null}
      <rect
        x={m.left}
        y={m.top}
        width={innerW}
        height={innerH}
        fill="transparent"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const clamped = nearestIndex(mx);
          if (clamped !== hover) setHover(clamped);
        }}
        onMouseLeave={() => setHover(null)}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          setHover(nearestIndex(mx));
        }}
      />
      {points.map((p, i) => {
        const shouldLabel = i % Math.ceil(points.length / xLabels.length || 1) === 0;
        return shouldLabel ? (
          <text key={`xl-${i}`} x={toX(i)} y={m.top + innerH + 16} fontSize="10" textAnchor="middle" fill="#64748b">
            {dayjs(p.x).format('MMM DD')}
          </text>
        ) : null;
      })}
      <text x={m.left} y={m.top - 2} fontSize="10" textAnchor="start" fill="#64748b">{yAxisLabel}</text>
      <text x={m.left + innerW / 2} y={m.top + innerH + 28} fontSize="10" textAnchor="middle" fill="#64748b">{xAxisLabel}</text>
      {hover != null ? (
        <g>
          {(() => {
            const baseX = toX(hover) + 8;
            const baseY = toY(points[hover].y) - 18;
            const boxW = secondaryPoints ? 220 : 160;
            const tX = Math.min(baseX, m.left + innerW - boxW);
            const tY = Math.max(baseY, m.top + 2);
            return (
              <>
                <rect
                  x={tX}
                  y={tY}
                  rx="4"
                  width={boxW}
                  height="32"
                  fill="#ffffff"
                  stroke="rgba(15,23,42,0.08)"
                />
                <text x={tX + 8} y={tY + 12} fontSize="10" fill="#0f172a">
                  {`${dayjs(points[hover].x).format('MMM DD')} · ${points[hover].y} ${tooltipUnitLabel}`}
                </text>
                <text x={tX + 8} y={tY + 24} fontSize="10" fill="#334155">
                  {secondaryPoints ? `Revenue: ${eur.format((tooltipExtraMap && tooltipExtraMap[points[hover].x]) || 0)}` : ''}
                </text>
              </>
            );
          })()}
        </g>
      ) : null}
      {maxY === 0 ? (
        <text x={m.left + innerW / 2} y={m.top + innerH / 2} fontSize="11" textAnchor="middle" fill="#94a3b8">Low activity</text>
      ) : null}
      {secondaryPoints ? (
        <g>
          <circle cx={m.left + innerW - 90} cy={m.top + 2} r="4" fill={color} />
          <text x={m.left + innerW - 82} y={m.top + 5} fontSize="10" fill="#334155">Transactions</text>
          <circle cx={m.left + innerW - 90} cy={m.top + 16} r="4" fill={secondaryColor} />
          <text x={m.left + innerW - 82} y={m.top + 19} fontSize="10" fill="#334155">Revenue (EUR)</text>
        </g>
      ) : null}
    </svg>
  );
};

const BarChart = ({ bars }) => {
  const w = 320;
  const h = 140;
  const bw = Math.max(20, Math.floor(w / Math.max(bars.length, 1)) - 8);
  const maxY = Math.max(...bars.map(b => b.value), 1);
  return (
    <svg width={w} height={h}>
      {bars.map((b, i) => {
        const x = i * (bw + 8) + 8;
        const bh = Math.round((b.value / maxY) * (h - 24));
        return (
          <g key={i}>
            <rect x={x} y={h - bh} width={bw} height={bh} rx="6" fill={b.color} />
            <text x={x + bw / 2} y={h - 4} fontSize="10" textAnchor="middle" fill="#64748b">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
};
const HorizontalBarChart = ({ bars }) => {
  const w = 360;
  const m = { top: 8, right: 24, bottom: 28, left: 110 };
  const barH = 18;
  const gap = 10;
  const innerW = w - m.left - m.right;
  const h = m.top + m.bottom + bars.length * (barH + gap);
  const maxV = Math.max(...bars.map(b => b.value), 1);
  const toW = (v) => Math.round((v / maxV) * innerW);
  const formatLabel = (s) => {
    const str = String(s || '');
    return str.length > 18 ? str.slice(0, 17) + '…' : str;
  };
  return (
    <svg width={w} height={h}>
      <line x1={m.left} y1={h - m.bottom} x2={m.left + innerW} y2={h - m.bottom} stroke="#e2e8f0" />
      {bars.map((b, i) => {
        const y = m.top + i * (barH + gap);
        const bw = toW(b.value);
        return (
          <g key={i}>
            <text x={m.left - 6} y={y + barH / 2} fontSize="10" textAnchor="end" fill="#64748b" dominantBaseline="middle">{formatLabel(b.label)}</text>
            <rect x={m.left} y={y} width={bw} height={barH} rx="6" fill={b.color} />
            <text x={m.left + bw + 6} y={y + barH / 2} fontSize="10" textAnchor="start" fill="#334155" dominantBaseline="middle">{b.value}</text>
          </g>
        );
      })}
      <text x={m.left + innerW / 2} y={h - 8} fontSize="10" textAnchor="middle" fill="#64748b">Count</text>
    </svg>
  );
};
const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);
  const adminAuthBlockedRef = useRef(false);
  const [summary, setSummary] = useState({
    usersCount: 0,
    farmersCount: 0,
    buyersCount: 0,
    pendingApprovals: 0,
    openComplaints: 0,
    transactionsCount: 0,
    revenueTotal: 0,
  });
  const [mapFields, setMapFields] = useState([]);
  const [cropDistribution, setCropDistribution] = useState([]);
  const [txSeries, setTxSeries] = useState([]);
  const [txRevenueByDay, setTxRevenueByDay] = useState({});
  const [userSeries, setUserSeries] = useState([]);
  const [complaintBars, setComplaintBars] = useState([]);
  const [insights, setInsights] = useState({ topCrops: [], regions: [], alerts: [] });
  const [tables, setTables] = useState({ complaints: [], transactions: [], approvals: [] });
  const [pages, setPages] = useState({ complaints: 0, transactions: 0, approvals: 0 });

  useEffect(() => {
    let mounted = true;
    let inFlight = false;
    const load = async ({ initial = false } = {}) => {
      if (inFlight) return;
      inFlight = true;
      const authDisabled = process.env.REACT_APP_AUTH_DISABLED === 'true';
      try {
        if (mounted && initial) setLoading(true);
        if (mounted) setError(null);
        const allowAdminCalls = !adminAuthBlockedRef.current;
        let adminUnauthorized = false;
        let usersCount = 0;
        let pendingApprovals = 0;
        let openComplaints = 0;
        let transactionsCount = 0;
        let revenueTotal = 0;
        let openComplaintsKnown = false;
        let fields = [];
        let allUsers = [];
        let approvals = [];
        let complaints = [];
        let transactions = [];
        let newUsers = [];
        let revenueFromOrders = null;
        const from = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        const to = dayjs().format('YYYY-MM-DD');

        const unwrapArray = (resp) => {
          const d = resp?.data;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d?.items)) return d.items;
          if (Array.isArray(d?.rows)) return d.rows;
          if (Array.isArray(d?.data)) return d.data;
          if (Array.isArray(d?.orders)) return d.orders;
          if (Array.isArray(d?.payments)) return d.payments;
          if (Array.isArray(d?.transactions)) return d.transactions;
          if (Array.isArray(d?.approvals)) return d.approvals;
          if (Array.isArray(d?.users)) return d.users;
          if (Array.isArray(d?.results)) return d.results;
          return [];
        };
        const unwrapOverview = (resp) => (resp?.data && typeof resp.data === 'object') ? resp.data : {};
        const toNumber = (v) => {
          if (typeof v === 'number' && Number.isFinite(v)) return v;
          if (typeof v === 'string') {
            const cleaned = v.replace(/[^0-9.-]/g, '');
            const parsed = cleaned ? Number(cleaned) : 0;
            return Number.isFinite(parsed) ? parsed : 0;
          }
          const n = Number(v ?? 0);
          return Number.isFinite(n) ? n : 0;
        };
        const isOpenComplaintStatus = (status) => {
          const normalized = String(status ?? '').trim().toLowerCase();
          return normalized === 'open' || normalized === 'new' || normalized === 'pending' || normalized === 'in_progress' || normalized === 'in progress' || normalized === 'active';
        };
        const normalizeComplaintRow = (c) => {
          const raw = String(c?.admin_remarks ?? c?.message ?? c?.description ?? c?.details ?? '').trim();
          const fallbackTitle = `Complaint ${String(c?.id || '').slice(0, 8)}`;
          const title = String(c?.title ?? c?.subject ?? '').trim() || (raw ? raw.split('\n')[0].slice(0, 80) : fallbackTitle);
          return {
            ...c,
            title,
            user_name: c?.user_name ?? c?.created_by ?? c?.user_id ?? '—',
            status: c?.status ?? 'open',
            updated_at: c?.updated_at ?? c?.created_at,
            created_at: c?.created_at ?? c?.updated_at,
          };
        };

        try {
          const usersResp = await adminService.getAllUsers();
          allUsers = unwrapArray(usersResp);
        } catch (e) {
          if (!(e?.response?.status === 401 && authDisabled)) throw e;
        }
        usersCount = allUsers.length;

        try {
          if (supabase) {
            const { data, error } = await supabase
              .from('complaints')
              .select('*')
              .order('updated_at', { ascending: false })
              .limit(200);
            if (!error) {
              openComplaintsKnown = true;
              complaints = (data || []).map(normalizeComplaintRow);
              openComplaints = complaints.filter((c) => isOpenComplaintStatus(c?.status)).length;
            }
          }
        } catch (e) {
          if (!(e?.response?.status === 401 && authDisabled)) {}
        }

        try {
          const ordersResp = await orderService.getAllOrders();
          const orders = unwrapArray(ordersResp);
          revenueFromOrders = orders.reduce((sum, o) => sum + toNumber(o.amount ?? o.total ?? o.total_amount ?? o.total_cost ?? o.total_price ?? o.price ?? o.value), 0);
        } catch (e) {
          if (!(e?.response?.status === 401 && authDisabled)) {}
        }

        if (!allowAdminCalls) {
          if (revenueFromOrders != null) {
            revenueTotal = revenueFromOrders;
          }
        }

        if (allowAdminCalls) {
          const settled = await Promise.allSettled([
            adminService.getNotificationsOverview(),
            adminService.getPendingFarmers(),
            adminService.getComplaints({ status: 'open' }),
            adminService.getCoinTransactions(),
            adminService.getPayments(),
            adminService.getNewUserRegistrations({ from, to }),
          ]);

          const overviewResp = settled[0].status === 'fulfilled' ? settled[0].value : null;
          const approvalsResp = settled[1].status === 'fulfilled' ? settled[1].value : null;
          const complaintsResp = settled[2].status === 'fulfilled' ? settled[2].value : null;
          const txResp = settled[3].status === 'fulfilled' ? settled[3].value : null;
          const paymentsResp = settled[4].status === 'fulfilled' ? settled[4].value : null;
          const newUsersResp = settled[5].status === 'fulfilled' ? settled[5].value : null;

          const overview = unwrapOverview(overviewResp);
          approvals = unwrapArray(approvalsResp);
          const apiComplaints = unwrapArray(complaintsResp);
          if (complaints.length === 0 && apiComplaints.length > 0) complaints = apiComplaints.map(normalizeComplaintRow);
          const coinTransactions = unwrapArray(txResp);
          const payments = unwrapArray(paymentsResp);
          newUsers = unwrapArray(newUsersResp);

          const normalizedPayments = payments.map((p) => ({
            ...p,
            id: p.id ?? p.payment_id ?? p.txn_id ?? p.transaction_id ?? p.reference ?? p.ref_id ?? `payment-${p.created_at ?? p.paid_at ?? p.timestamp ?? Math.random()}`,
            amount: toNumber(p.amount ?? p.total ?? p.total_amount ?? p.total_cost ?? p.price ?? p.value),
            created_at: p.created_at ?? p.paid_at ?? p.timestamp ?? p.createdAt,
          }));
          const normalizedCoinTx = coinTransactions.map((t) => ({
            ...t,
            id: t.id ?? t.txn_id ?? t.transaction_id ?? t.ref_id ?? `coin-${t.created_at ?? t.timestamp ?? Math.random()}`,
            amount: toNumber(t.amount ?? t.total ?? t.total_amount ?? t.coins ?? t.value),
            created_at: t.created_at ?? t.timestamp ?? t.createdAt,
          }));
          const txRows = normalizedCoinTx.length > 0 ? normalizedCoinTx : normalizedPayments;
          transactions = txRows;

          if (!usersCount) usersCount = toNumber(overview.usersCount ?? overview.totalUsers ?? overview.newUserRegistrations);
          pendingApprovals = approvals.length > 0 ? approvals.length : toNumber(overview.pendingApprovals ?? overview.pendingFarmerApprovals);
          if (!openComplaintsKnown) {
            if (settled[2].status === 'fulfilled') {
              openComplaintsKnown = true;
              openComplaints = apiComplaints.filter((c) => isOpenComplaintStatus(c?.status)).length;
            } else {
              const overviewOpenComplaints = overview.openComplaints ?? overview.newComplaints ?? overview.totalOpenComplaints;
              if (overviewOpenComplaints != null) openComplaintsKnown = true;
              openComplaints = toNumber(overviewOpenComplaints);
            }
          }
          transactionsCount = txRows.length > 0 ? txRows.length : toNumber(
            typeof overview.transactionsSummary === 'number'
              ? overview.transactionsSummary
              : (overview.transactionsSummary?.count ?? overview.transactionsSummary?.totalTransactions ?? overview.transactionsCount)
          );
          if (settled[4].status === 'fulfilled') {
            revenueTotal = normalizedPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);
          } else if (revenueFromOrders != null) {
            revenueTotal = revenueFromOrders;
          } else {
            const overviewRevenue = typeof overview.revenueSummary === 'number'
              ? overview.revenueSummary
              : (overview.revenueSummary?.total ?? overview.revenueSummary?.amount ?? overview.revenueTotal);
            revenueTotal = toNumber(overviewRevenue);
          }

          const any401 = settled.some((r) => r.status === 'rejected' && r.reason?.response?.status === 401);
          adminUnauthorized = any401;
          if (any401 && authDisabled) adminAuthBlockedRef.current = true;
          if (any401 && !authDisabled) {
            const first401 = settled.find((r) => r.status === 'rejected' && r.reason?.response?.status === 401);
            throw first401.reason;
          }
        }

        if (!Number(revenueTotal) && supabase) {
          try {
            const { data, error } = await supabase
              .from('payments')
              .select('*');
            if (!error && Array.isArray(data) && data.length > 0) {
              const sum = data.reduce((s, p) => s + toNumber(p.amount ?? p.total ?? p.total_amount ?? p.total_cost ?? p.total_price ?? p.price ?? p.value), 0);
              if (Number(sum)) revenueTotal = sum;
            }
          } catch (_) {}
        }

        if (!Number(revenueTotal) && supabase) {
          try {
            const { data, error } = await supabase
              .from('orders')
              .select('*');
            if (!error && Array.isArray(data) && data.length > 0) {
              const sum = data.reduce((s, o) => s + toNumber(o.amount ?? o.total ?? o.total_amount ?? o.total_cost ?? o.total_price ?? o.price ?? o.value), 0);
              if (Number(sum)) revenueTotal = sum;
            }
          } catch (_) {}
        }

        try {
          const fieldsResp = await fieldsService.getAll();
          fields = Array.isArray(fieldsResp.data) ? fieldsResp.data : [];
        } catch (_) {}
        const farmersCount = allUsers.filter(u => String(u.user_type).toLowerCase() === 'farmer').length;
        const buyersCount = allUsers.filter(u => String(u.user_type).toLowerCase() === 'buyer').length;

        const fieldRows = fields.map(f => {
          let lng = null, lat = null;
          if (Array.isArray(f.coordinates) && f.coordinates.length >= 2) { lng = f.coordinates[0]; lat = f.coordinates[1]; }
          else if (f.longitude != null && f.latitude != null) { lng = typeof f.longitude === 'string' ? parseFloat(f.longitude) : f.longitude; lat = typeof f.latitude === 'string' ? parseFloat(f.latitude) : f.latitude; }
          const category = f.subcategory || f.category || f.product_type || 'Unknown';
          const location = f.location || '';
          const area = Number(f.area_m2 ?? f.field_size ?? f.total_area ?? 0) || 0;
          return {
            id: f.id,
            name: f.name || f.product_name || 'Field',
            coordinates: Array.isArray(f.coordinates) ? f.coordinates : (lng != null && lat != null ? [lng, lat] : null),
            category,
            location,
            area,
            total_area: area,
            field_size: area,
            harvest_dates: f.harvest_dates ?? f.harvestDates ?? null,
            harvest_date: f.harvest_date ?? f.harvestDate ?? null,
            harvest_start_date: f.harvest_start_date ?? f.harvestStartDate ?? null,
            harvest_end_date: f.harvest_end_date ?? f.harvestEndDate ?? null
          };
        });
        const mapRows = fieldRows.filter(f => Array.isArray(f.coordinates) && Number.isFinite(f.coordinates[0]) && Number.isFinite(f.coordinates[1]));

        const toStableInt = (value) => {
          const s = String(value ?? '');
          let h = 0;
          for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
          return Math.abs(h);
        };
        const demoMode = authDisabled && (adminUnauthorized || adminAuthBlockedRef.current);
        if (demoMode) {
          const shouldMockUsers = allUsers.length === 0;
          if (shouldMockUsers && !Number(usersCount)) usersCount = Math.max(8, fieldRows.length * 3 + 12);
          const fallbackFarmers = Math.max(3, Math.round((usersCount || 12) * 0.45));
          const nextFarmersCount = (farmersCount || (shouldMockUsers ? fallbackFarmers : 0));
          const baseSeed = toStableInt(`${usersCount}-${fieldRows.length}-${dayjs().format('YYYY-MM-DD')}`);
          if (!Number(pendingApprovals)) pendingApprovals = Math.max(1, Math.round((baseSeed % 7) / 2));
          if (!Number(transactionsCount)) transactionsCount = Math.max(6, (baseSeed % 17) + 6);
          if (approvals.length === 0) {
            approvals = Array.from({ length: pendingApprovals }).map((_, i) => ({
              id: `approval-${i + 1}`,
              name: `Farmer ${i + 1}`,
              email: `farmer${i + 1}@example.com`,
              approval_status: 'pending',
              requested_at: dayjs().subtract(i + 1, 'day').toISOString(),
            }));
          }
          if (transactions.length === 0) {
            const daysBack = 28;
            transactions = [];
            for (let i = 0; i < daysBack; i += 1) {
              const perDay = ((baseSeed + i * 7) % 5); // 0..4 tx per day
              for (let j = 0; j < perDay; j += 1) {
                transactions.push({
                  id: `txn-${i + 1}-${j + 1}`,
                  amount: Math.round((((baseSeed + i * 13 + j * 5) % 19) + 4) * 100),
                  created_at: dayjs().subtract(i, 'day').toISOString(),
                });
              }
            }
          }
          if (newUsers.length === 0) {
            newUsers = Array.from({ length: Math.min(12, usersCount) }).map((_, i) => ({
              id: `user-${i + 1}`,
              name: `User ${i + 1}`,
              created_at: dayjs().subtract(i * 2, 'day').toISOString(),
            }));
          }
          if (shouldMockUsers) {
            allUsers = Array.from({ length: usersCount }).map((_, i) => ({
              id: `user-${i + 1}`,
              name: `User ${i + 1}`,
              email: `user${i + 1}@example.com`,
              user_type: i < nextFarmersCount ? 'farmer' : 'buyer',
              created_at: dayjs().subtract(i % 45, 'day').toISOString(),
            }));
          } else if (!usersCount) {
            usersCount = allUsers.length;
          }
        }

        const areaAgg = {};
        const countAgg = {};
        const labelByKey = {};
        const canon = (s) => String(s || 'Unknown').trim().toLowerCase();
        const toTitle = (s) => String(s || 'Unknown').trim().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');
        fieldRows.forEach(f => {
          const raw = f.category || 'Unknown';
          const key = canon(raw);
          labelByKey[key] = labelByKey[key] || toTitle(raw);
          const area = f.area > 0 ? f.area : 0;
          areaAgg[key] = (areaAgg[key] || 0) + area;
          countAgg[key] = (countAgg[key] || 0) + 1;
        });
        const areaTotal = Object.values(areaAgg).reduce((s, v) => s + v, 0);
        const basisAgg = areaTotal > 0 ? areaAgg : countAgg;
        const cropKeys = Object.keys(basisAgg);
        const cropSegs = cropKeys.map((k) => ({ label: labelByKey[k], value: basisAgg[k] })).sort((a,b)=>b.value-a.value);
        const txByDay = {};
        const revByDay = {};
        transactions.forEach(t => {
          const d = dayjs(t.created_at || t.timestamp || Date.now()).format('YYYY-MM-DD');
          txByDay[d] = (txByDay[d] || 0) + 1;
          const amt = toNumber(t.amount ?? t.total ?? t.total_amount ?? t.total_cost ?? t.price ?? t.value);
          revByDay[d] = (revByDay[d] || 0) + (amt || 0);
        });
        const days = Array.from({ length: 14 }).map((_, i) => dayjs().subtract(13 - i, 'day').format('YYYY-MM-DD'));
        const txPts = days.map(d => ({ x: d, y: txByDay[d] || 0 }));
        const userByDay = {};
        const userEvents = newUsers.length > 0
          ? newUsers
          : allUsers.filter(u => {
            const created = u.created_at || u.joined_at || u.createdAt;
            if (!created) return false;
            return dayjs(created).isAfter(dayjs().subtract(60, 'day'));
          });
        userEvents.forEach(u => { const d = dayjs(u.created_at || u.joined_at || u.createdAt || Date.now()).format('YYYY-MM-DD'); userByDay[d] = (userByDay[d] || 0) + 1; });
        const userPts = days.map(d => ({ x: d, y: userByDay[d] || 0 }));
        const idToEmail = {};
        const idToUser = {};
        const nameToUser = {};
        allUsers.forEach(u => {
          const uid = String(u?.id ?? '').trim();
          if (uid) idToUser[uid] = u;
          const uname = String(u?.name ?? u?.full_name ?? '').trim().toLowerCase();
          if (uname) nameToUser[uname] = u;
          if (uid && u?.email) idToEmail[uid] = u.email;
        });
        const isEmail = (s) => /\S+@\S+\.\S+/.test(String(s || '').trim());
        const userIds = Array.from(new Set(complaints.map(c => String(c?.user_id ?? c?.created_by ?? c?.user ?? c?.userId ?? '').trim()).filter(Boolean)));
        const complaintEmails = Array.from(new Set(complaints.map(c => {
          const e1 = c?.user_email ?? c?.email;
          const e2 = isEmail(c?.user_name) ? c.user_name : null;
          const e3 = isEmail(c?.created_by) ? c.created_by : null;
          return e1 || e2 || e3 || null;
        }).filter(Boolean).map(String)));
        if (supabase && userIds.length > 0) {
          try {
            const { data: userRows, error: userErr } = await supabase.from('users').select('id,email,name').in('id', userIds);
            if (!userErr && Array.isArray(userRows)) {
              userRows.forEach(u => {
                const uid = String(u?.id ?? '').trim();
                if (uid) {
                  idToUser[uid] = idToUser[uid] || u;
                  if (u?.email) idToEmail[uid] = u.email;
                  const uname = String(u?.name ?? '').trim().toLowerCase();
                  if (uname) nameToUser[uname] = nameToUser[uname] || u;
                }
              });
            }
          } catch (_) {}
        }
        if (supabase && complaintEmails.length > 0) {
          try {
            const { data: userRows2, error: userErr2 } = await supabase.from('users').select('id,email,name').in('email', complaintEmails);
            if (!userErr2 && Array.isArray(userRows2)) {
              userRows2.forEach(u => {
                const uid = String(u?.id ?? '').trim();
                const email = String(u?.email ?? '').trim();
                if (uid) idToUser[uid] = idToUser[uid] || u;
                if (email) idToEmail[uid] = idToEmail[uid] || email;
                const uname = String(u?.name ?? '').trim().toLowerCase();
                if (uname) nameToUser[uname] = nameToUser[uname] || u;
              });
            }
          } catch (_) {}
        }
        complaints = complaints.map(c => {
          const uid = String(c?.user_id ?? c?.created_by ?? c?.user ?? c?.userId ?? '');
          const rawEmail = c?.user_email ?? c?.email ?? null;
          const byId = uid ? idToUser[uid] : null;
          const byName = String(c?.user_name ?? c?.created_by ?? '').trim().toLowerCase();
          const nameMatch = byName ? nameToUser[byName] : null;
          const emailFromName = isEmail(c?.user_name) ? c.user_name : null;
          const email = rawEmail || emailFromName || (byId?.email) || (nameMatch?.email) || null;
          return { ...c, user_email: email };
        });
        const complaintKinds = {};
        complaints.forEach(c => {
          const k = c.category || c.type || c.complaint_type || c.complaint_category || c.reason || 'Other';
          complaintKinds[k] = (complaintKinds[k] || 0) + 1;
        });
        const complaintTone = (label) => {
          const s = String(label || '').trim().toLowerCase();
          if (s.includes('service') || s.includes('support') || s.includes('customer') || s.includes('help')) return '#fca5a5';
          if (s.includes('quality') || s.includes('defect') || s.includes('damaged') || s.includes('broken')) return '#fecf8f';
          if (s.includes('delivery') || s.includes('delay') || s.includes('shipment') || s.includes('logistics')) return '#fdbA74';
          if (s.includes('payment') || s.includes('billing') || s.includes('charge')) return '#2bb673';
          if (s.includes('refund')) return '#5b8def';
          if (s.includes('field') || s.includes('crop') || s.includes('condition') || s.includes('soil') || s.includes('pest')) return '#199e61';
          if (s.includes('order') || s.includes('cart') || s.includes('checkout') || s.includes('fulfillment')) return '#4f83e1';
          if (s.includes('buyer') || s.includes('misconduct') || s.includes('fraud') || s.includes('abuse') || s.includes('spam')) return '#fed7d7';
          return '#fecf8f';
        };
        const complaintBarsData = Object.keys(complaintKinds).map((k) => ({ label: k, value: complaintKinds[k], color: complaintTone(k) }));
        const topCrops = cropSegs.sort((a,b)=>b.value-a.value).slice(0,5).map(s => ({ name: s.label, value: s.value }));
        const cityCounts = {};
        fieldRows.forEach(f => { const city = String(f.location || '').split(',')[0].trim(); if (city) cityCounts[city] = (cityCounts[city] || 0) + 1; });
        const regions = Object.keys(cityCounts).map(c => ({ name: c, count: cityCounts[c] })).sort((a,b)=>b.count-a.count).slice(0,5);
        const alerts = [
          ...userEvents.slice(0,3).map(u => ({ type: 'user', title: u.name || u.full_name || u.email || 'New user', time: u.created_at || u.joined_at || u.createdAt })),
          ...approvals.slice(0,3).map(a => ({ type: 'approval', title: a.name, time: a.requested_at })),
          ...complaints.slice(0,3).map(c => ({ type: 'complaint', title: c.title || c.subject, time: c.updated_at || c.created_at })),
        ];
        const complaintsTable = complaints.sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at));
        const transactionsTable = transactions.sort((a,b)=>new Date(b.created_at||b.timestamp)-new Date(a.created_at||a.timestamp));
        const approvalsTable = approvals;

        if (mounted) {
          const finalFarmersCount = allUsers.filter(u => String(u.user_type).toLowerCase() === 'farmer').length || farmersCount;
          const finalBuyersCount = allUsers.filter(u => String(u.user_type).toLowerCase() === 'buyer').length || buyersCount;
          setSummary({ usersCount, farmersCount: finalFarmersCount, buyersCount: finalBuyersCount, pendingApprovals, openComplaints, transactionsCount, revenueTotal });
          setMapFields(mapRows);
          setCropDistribution(cropSegs);
          setTxSeries(txPts);
          setTxRevenueByDay(revByDay);
          setUserSeries(userPts);
          setComplaintBars(complaintBarsData);
          setInsights({ topCrops, regions, alerts });
          setTables({ complaints: complaintsTable, transactions: transactionsTable, approvals: approvalsTable });
          hasLoadedRef.current = true;
        }
      } catch (e) {
        if (mounted) {
          const status = e?.response?.status;
          if (status === 401 && authDisabled) return;
          if (status === 401 || !hasLoadedRef.current) setError(e);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
        inFlight = false;
      }
    };
    load({ initial: true });
    const refreshMs = Number(process.env.REACT_APP_ADMIN_DASHBOARD_REFRESH_MS ?? 15000);
    const intervalId = window.setInterval(() => load({ initial: false }), Math.max(5000, refreshMs));
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') load({ initial: false });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    const realtimeEnabled = process.env.REACT_APP_ADMIN_DASHBOARD_REALTIME !== 'false';
    const channel = supabase && realtimeEnabled
      ? supabase
        .channel('admin-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => load({ initial: false }))
        .subscribe()
      : null;

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
      if (channel) channel.unsubscribe();
    };
  }, [location.pathname, token]);

  useEffect(() => {
    const maxPage = (key) => Math.max(0, Math.ceil((tables[key]?.length || 0) / (pageSizes[key] || 5)) - 1);
    setPages((p) => {
      const next = {
        complaints: Math.min(p.complaints, maxPage('complaints')),
        transactions: Math.min(p.transactions, maxPage('transactions')),
        approvals: Math.min(p.approvals, maxPage('approvals')),
      };
      return next.complaints === p.complaints && next.transactions === p.transactions && next.approvals === p.approvals ? p : next;
    });
  }, [tables]);

  const paged = useMemo(() => {
    const slice = (arr, p, key) => {
      const size = pageSizes[key] || 5;
      return arr.slice(p * size, p * size + size);
    };
    return {
      complaints: slice(tables.complaints, pages.complaints, 'complaints'),
      transactions: slice(tables.transactions, pages.transactions, 'transactions'),
      approvals: slice(tables.approvals, pages.approvals, 'approvals'),
    };
  }, [tables, pages]);

  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  const maxPage = (key) => Math.max(0, Math.ceil((tables[key]?.length || 0) / (pageSizes[key] || 5)) - 1);
  const pageLabel = (key) => {
    const totalPages = Math.max(1, Math.ceil((tables[key]?.length || 0) / (pageSizes[key] || 5)));
    return `Page ${Math.min(pages[key] + 1, totalPages)} of ${totalPages}`;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1400px', mx: 'auto', mt: { xs: 1.5, sm: 2 }, display: 'grid', gap: sectionGap }}>
      {error?.response?.status === 401 && process.env.REACT_APP_AUTH_DISABLED !== 'true' && (
        <Card sx={{ ...cardSx, border: '1px solid', borderColor: 'error.light' }}>
          <CardContent sx={cardContentSx}>
            <Typography variant="subtitle1" color="error.main" sx={{ fontWeight: 700 }}>Unauthorized / Session expired</Typography>
            <Typography variant="body2" color="text.secondary">Please log in as an admin to access this page.</Typography>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: sectionGap,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
        }}
      >
        <StatCard title="Total Users" value={summary.usersCount} loading={loading} color="teal" icon={HowToReg} />
        <StatCard title="Total Farmers" value={summary.farmersCount} loading={loading} color="green" icon={LocalFlorist} />
        <StatCard title="Total Buyers" value={summary.buyersCount} loading={loading} color="cyan" icon={ReceiptLong} />
        <StatCard title="Open Complaints" value={summary.openComplaints} loading={loading} color="orange" icon={ReportProblemOutlined} />
        <StatCard title="Total Revenue" value={eur.format(summary.revenueTotal || 0)} loading={loading} color="purple" icon={ShowChart} />
      </Box>

      <Box sx={{ display: 'grid', gap: sectionGap, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, alignItems: 'stretch' }}>
        <Card sx={{ ...cardSx, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <CardHeader title="Farms & Fields" />
            <Box sx={{ mt: 2, flex: 1, minHeight: { xs: 320, sm: 380, md: 520 }, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              {!MAPBOX_TOKEN ? (
                <Box sx={{ height: '100%', display: 'flex' }}>
                  <EmptyState
                    icon={MapOutlined}
                    title="Map not connected"
                    subtitle="Add REACT_APP_MAPBOX_ACCESS_TOKEN to enable the farms & fields map."
                    accent="rgba(96,165,250,0.16)"
                    iconColor="rgba(37,99,235,0.95)"
                  />
                </Box>
              ) : (
                <EnhancedFarmMap
                  userType="admin"
                  user={null}
                  fields={mapFields.length > 0 ? mapFields : undefined}
                  height="100%"
                  embedded
                  minimal
                />
              )}
              </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: sectionGap, height: '100%' }}>
          <Card sx={{ ...cardSx, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardHeader title="Crop Distribution (By Area)" />
              <Box sx={{ mt: 2, flex: 1, display: 'flex', alignItems: 'center' }}>
                {loading ? (
                  <Skeleton variant="rectangular" height={140} width="100%" />
                ) : cropDistribution.length === 0 ? (
                  <EmptyState
                    icon={PieChartOutline}
                    title="No crop distribution yet"
                    subtitle="Crops will appear once fields are available with a category."
                    compact
                    accent="rgba(34,197,94,0.14)"
                    iconColor="rgba(21,128,61,0.95)"
                  />
                ) : (
                  <DonutChart segments={cropDistribution} />
                )}
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ ...cardSx, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardHeader title="Transactions Over Time" subtitle="Daily count of payments & coin events. Hover for revenue." />
              <Box sx={{ mt: 2, flex: 1, display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
                {loading ? (
                  <Skeleton variant="rectangular" height={140} width="100%" />
                ) : (
                  <LineChart
                    points={txSeries}
                    color="#22c55e"
                    tooltipExtraMap={Object.fromEntries(Object.entries(txRevenueByDay))}
                    secondaryPoints={txSeries.map(pt => ({ x: pt.x, y: txRevenueByDay[pt.x] || 0 }))}
                    secondaryColor="#5b8def"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: sectionGap,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          alignItems: 'stretch',
        }}
      >
        <Card sx={{ ...cardSx, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <CardHeader title="User Growth" subtitle="Daily new user registrations" />
            <Box sx={{ mt: 2, flex: 1, display: 'flex', alignItems: 'center', overflowX: 'hidden' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={160} width="100%" />
              ) : userSeries.some((p) => p.y > 0) ? (
                <LineChart points={userSeries} color="#22c55e" yAxisLabel="New Users" xAxisLabel="Date" smooth={false} areaGradient={false} tooltipUnitLabel="new users" />
              ) : (
                <EmptyState
                  icon={ShowChart}
                  title="No new users yet"
                  subtitle="When new accounts are created, you’ll see growth over time here."
                  accent="rgba(96,165,250,0.16)"
                  iconColor="rgba(37,99,235,0.95)"
                />
              )}
            </Box>
            {(() => {
              const maxUsers = Math.max(...userSeries.map(p => p.y), 0);
              return maxUsers <= 1 ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 700 }}>
                  Low activity due to limited users in MVP phase
                </Typography>
              ) : null;
            })()}
          </CardContent>
        </Card>
        <Card sx={{ ...cardSx, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <CardHeader title="Complaints by Category" subtitle="Last 30 days" />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontWeight: 700 }}>
              Distribution of complaints by category
            </Typography>
            {complaintBars.length === 0 ? (
              <EmptyState
                icon={DonutSmall}
                title="No complaint categories yet"
                subtitle="When complaints include a category, you’ll see the breakdown here."
                accent="rgba(249,115,22,0.14)"
                iconColor="rgba(234,88,12,0.95)"
              />
            ) : (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', px: 1 }}>
                <HorizontalBarChart bars={complaintBars} />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: sectionGap,
          p: 0,
        }}
      >
        

        <Box
          sx={{
            display: 'grid',
            gap: sectionGap,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            alignItems: 'stretch',
          }}
        >
          <Box sx={{ display: 'flex', minWidth: 0 }}>
            <Card sx={{ ...cardSx, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                <CardHeader title="Top Crops" />
                <Box sx={{ mt: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {insights.topCrops.length === 0 ? (
                    <EmptyState
                      icon={LocalFlorist}
                      title="No crop signals yet"
                      subtitle="Top crops will appear as more farms and fields are added."
                      compact
                      accent="rgba(34,197,94,0.14)"
                      iconColor="rgba(21,128,61,0.95)"
                    />
                  ) : (
                    <Stack spacing={1}>
                      {insights.topCrops.map((c, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <img src={getProductIcon(c.name)} alt={c.name} style={{ width: 22, height: 22 }} />
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{c.name}</Typography>
                          </Stack>
                          <Chip label={Math.round(c.value)} size="small" />
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', minWidth: 0 }}>
            <Card sx={{ ...cardSx, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                <CardHeader title="Most Active Regions" />
                <Box sx={{ mt: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {insights.regions.length === 0 ? (
                    <EmptyState
                      icon={Public}
                      title="No regions yet"
                      subtitle="Regions will show up once farms have location data."
                      compact
                      accent="rgba(96,165,250,0.16)"
                      iconColor="rgba(37,99,235,0.95)"
                    />
                  ) : (
                    <Stack spacing={1}>
                      {insights.regions.map((r, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{r.name}</Typography>
                          <Chip label={r.count} size="small" />
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', minWidth: 0 }}>
            <Card sx={{ ...cardSx, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                <CardHeader title="Recent Admin Alerts" />
                <Box sx={{ mt: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {insights.alerts.length === 0 ? (
                    <EmptyState
                      icon={NotificationsNone}
                      title="No alerts right now"
                      subtitle="Alerts will appear for new users, approvals, and complaints."
                      compact
                      accent="rgba(168,85,247,0.14)"
                      iconColor="rgba(126,34,206,0.95)"
                    />
                  ) : (
                    <Stack spacing={1}>
                      {insights.alerts.map((a, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Chip label={a.type} size="small" />
                          <Typography variant="body2" sx={{ flex: 1, ml: 1, fontWeight: 700 }} noWrap>{a.title}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{new Date(a.time || Date.now()).toLocaleString()}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: sectionGap,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            alignItems: 'stretch',
          }}
        >
          <Box sx={{ display: 'flex', minWidth: 0 }}>
            <Card sx={{ ...cardSx, width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                <CardHeader title="Recent Complaints" subtitle={pageLabel('complaints')} />
                <TableContainer component={Paper} elevation={0} sx={{ mt: 2, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.02)' }}>
                        <TableCell sx={tableHeadCellSx}>Admin Remarks</TableCell>
                        <TableCell sx={tableHeadCellSx}>User</TableCell>
                        <TableCell sx={tableHeadCellSx}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.complaints.length === 0 ? (
                        <TableEmptyRow colSpan={3} icon={ReportProblemOutlined} title="No complaints yet" subtitle="New complaints will show up here for quick review." />
                      ) : (
                        paged.complaints.map((c) => (
                          <TableRow 
                            key={c.id} 
                            hover 
                            sx={{ py: 0.5, cursor: 'pointer' }}
                            onClick={() => navigate(`/admin/qa?id=${c.id}`)}
                          >
                            <TableCell sx={tableBodyCellSx}>{c.admin_remarks || c.message || c.description || c.details || c.title || c.subject || '—'}</TableCell>
                            <TableCell sx={tableBodyCellSx}>{c.user_email || c.email || (/\S+@\S+\.\S+/.test(String(c.user_name||'')) ? c.user_name : '—')}</TableCell>
                            <TableCell sx={tableBodyCellSx}>{c.status || '—'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{tables.complaints.length} total</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" disabled={pages.complaints === 0} onClick={() => setPages((p) => ({ ...p, complaints: Math.max(0, p.complaints - 1) }))}>Prev</Button>
                    <Button size="small" variant="outlined" disabled={pages.complaints >= maxPage('complaints')} onClick={() => setPages((p) => ({ ...p, complaints: Math.min(maxPage('complaints'), p.complaints + 1) }))}>Next</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', minWidth: 0 }}>
            <Card sx={{ ...cardSx, width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                <CardHeader title="Recent Transactions" subtitle={pageLabel('transactions')} />
                <TableContainer component={Paper} elevation={0} sx={{ mt: 2, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.02)' }}>
                        <TableCell sx={tableHeadCellSx}>Type</TableCell>
                        <TableCell sx={tableHeadCellSx}>Amount</TableCell>
                        <TableCell sx={tableHeadCellSx}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.transactions.length === 0 ? (
                        <TableEmptyRow colSpan={3} icon={ReceiptLong} title="No transactions yet" subtitle="Recent payments and coin activity will appear here." />
                      ) : (
                        paged.transactions.map((t) => (
                          <TableRow 
                            key={t.id} 
                            hover 
                            sx={{ py: 0.5, cursor: 'pointer' }}
                            onClick={() => navigate(`/admin/coins?id=${t.id}`)}
                          >
                            <TableCell sx={tableBodyCellSx}>
                              {String(t.type || t.transaction_type || '').toLowerCase() === 'credit' ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <ArrowDownward sx={{ color: 'success.main', fontSize: 18 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Credit</Typography>
                                </Stack>
                              ) : (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <ArrowUpward sx={{ color: 'error.main', fontSize: 18 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Debit</Typography>
                                </Stack>
                              )}
                            </TableCell>
                            <TableCell sx={tableBodyCellSx}>{t.amount || t.total || 0}</TableCell>
                            <TableCell sx={tableBodyCellSx}>{new Date(t.created_at || t.timestamp || Date.now()).toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{tables.transactions.length} total</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" disabled={pages.transactions === 0} onClick={() => setPages((p) => ({ ...p, transactions: Math.max(0, p.transactions - 1) }))}>Prev</Button>
                    <Button size="small" variant="outlined" disabled={pages.transactions >= maxPage('transactions')} onClick={() => setPages((p) => ({ ...p, transactions: Math.min(maxPage('transactions'), p.transactions + 1) }))}>Next</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', minWidth: 0 }}>
            <Card sx={{ ...cardSx, width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ ...cardContentSx, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                <CardHeader title="Pending Approvals" subtitle={pageLabel('approvals')} />
                <TableContainer component={Paper} elevation={0} sx={{ mt: 2, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.02)' }}>
                        <TableCell sx={tableHeadCellSx}>Name</TableCell>
                        <TableCell sx={tableHeadCellSx}>Email</TableCell>
                        <TableCell sx={tableHeadCellSx}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.approvals.length === 0 ? (
                        <TableEmptyRow colSpan={3} icon={HowToReg} title="No approvals pending" subtitle="New requests will appear here for review." />
                      ) : (
                        paged.approvals.map((a) => (
                          <TableRow 
                            key={a.id} 
                            hover 
                            sx={{ py: 0.5, cursor: 'pointer' }}
                            onClick={() => navigate(`/admin/users?id=${a.id}`)}
                          >
                            <TableCell sx={tableBodyCellSx}>{a.name}</TableCell>
                            <TableCell sx={tableBodyCellSx}>{a.email}</TableCell>
                            <TableCell sx={tableBodyCellSx}>{a.approval_status || 'pending'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{tables.approvals.length} total</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" disabled={pages.approvals === 0} onClick={() => setPages((p) => ({ ...p, approvals: Math.max(0, p.approvals - 1) }))}>Prev</Button>
                    <Button size="small" variant="outlined" disabled={pages.approvals >= maxPage('approvals')} onClick={() => setPages((p) => ({ ...p, approvals: Math.min(maxPage('approvals'), p.approvals + 1) }))}>Next</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
