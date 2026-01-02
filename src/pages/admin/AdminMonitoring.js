import { useEffect, useState } from 'react';
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography, Chip, Grid, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Skeleton } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { adminService } from '../../services/admin';
import { useLocation } from 'react-router-dom';

const StatChip = ({ label, color }) => (
  <Chip label={label} size="small" sx={{ mr: 1, mb: 1, bgcolor: `${color}.50`, color: `${color}.700` }} />
);

const MissingChip = ({ text }) => (
  <Chip label={text} size="small" sx={{ mr: 1, mb: 1, bgcolor: 'error.light', color: 'error.contrastText' }} />
);

const FieldRow = ({ field }) => {
  const consistency = field.consistency || {};
  const missing = Array.isArray(consistency.missing) ? consistency.missing : [];
  return (
    <TableRow hover>
      <TableCell sx={{ fontWeight: 600 }}>{field.name || 'Unnamed Field'}</TableCell>
      <TableCell>{field.production_rate ?? '—'} {field.production_rate_unit || ''}</TableCell>
      <TableCell>{field.quantity ?? '—'}</TableCell>
      <TableCell>{field.available_area ?? '—'} / {field.total_area ?? '—'}</TableCell>
      <TableCell>
        {missing.length === 0 ? (
          <Chip label={'Consistent'} size="small" color="success" />
        ) : (
          missing.map((m) => <MissingChip key={m} text={`Missing: ${m}`} />)
        )}
      </TableCell>
    </TableRow>
  );
};

const FarmAccordion = ({ farm }) => {
  const fields = Array.isArray(farm.fields) ? farm.fields : [];
  const stats = farm.stats || {};
  return (
    <Accordion disableGutters sx={{ mb: 1, border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{farm.name || 'Unnamed Farm'}</Typography>
          <Box>
            <StatChip label={`Fields: ${stats.fieldsCount ?? fields.length}`} color={'primary'} />
            <StatChip label={`Production: ${stats.totalProduction ?? 'N/A'}`} color={'success'} />
            <StatChip label={`Quantity: ${stats.totalQuantity ?? 'N/A'}`} color={'info'} />
            <StatChip label={`Missing: ${stats.missingDataCount ?? 0}`} color={'warning'} />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Production Rate</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Area (available/total)</TableCell>
                <TableCell>Consistency</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">No fields</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((f) => <FieldRow key={f.id || f.name} field={f} />)
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
};

const FarmerAccordion = ({ farmer }) => {
  const farms = Array.isArray(farmer.farms) ? farmer.farms : [];
  const stats = farmer.stats || {};
  const name = farmer.farmer?.name || farmer.name || 'Unnamed Farmer';
  const email = farmer.farmer?.email || farmer.email || '';
  return (
    <Accordion disableGutters sx={{ mb: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{name}</Typography>
          <Typography variant="body2" color="text.secondary">{email}</Typography>
          <Box sx={{ mt: 1 }}>
            <StatChip label={`Farms: ${farms.length}`} color={'primary'} />
            <StatChip label={`Fields: ${stats.fieldsCount ?? 'N/A'}`} color={'primary'} />
            <StatChip label={`Missing: ${stats.missingDataCount ?? 0}`} color={'warning'} />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {farms.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No farms</Typography>
        ) : (
          farms.map((farm) => <FarmAccordion key={farm.id || farm.name} farm={farm} />)
        )}
      </AccordionDetails>
    </Accordion>
  );
};

const AdminMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await adminService.getProductionConsistency();
        const d = resp.data?.data || [];
        if (mounted) setData(Array.isArray(d) ? d : []);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: { xs: 1.5, sm: 2 } }}>
        <Grid container spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={12} key={i}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Skeleton width={240} />
                  <Skeleton width={180} />
                  <Skeleton width={320} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mt: { xs: 1.5, sm: 2 } }}>
      {error?.response?.status === 401 && !(process.env.REACT_APP_AUTH_DISABLED === 'true' || location.pathname.startsWith('/admin')) && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'error.light', mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" color="error.main" sx={{ fontWeight: 700 }}>Unauthorized / Session expired</Typography>
            <Typography variant="body2" color="text.secondary">Please log in as an admin to access this page.</Typography>
          </CardContent>
        </Card>
      )}
      {data.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No monitoring data available</Typography>
      ) : (
        data.map((farmer, idx) => <FarmerAccordion key={farmer.farmer?.id || farmer.id || idx} farmer={farmer} />)
      )}
    </Box>
  );
};

export default AdminMonitoring;
