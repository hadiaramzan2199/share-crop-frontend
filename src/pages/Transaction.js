import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Button,
  IconButton,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  Agriculture,
  TrendingUp,
  MoreVert,
  Assessment,
  AccountBalance,
  Payment,
  Receipt,
  MonetizationOn,
  TrendingDown,
  Search,
  FilterList,
  Download,
  ArrowUpward,
  ArrowDownward,
  SwapHoriz,
} from '@mui/icons-material';

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Currency symbols mapping
  const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'PKR': '₨',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF'
  };

  // Load user preferences
  useEffect(() => {
    // Removed localStorage.getItem('userPreferences') as localStorage is deprecated.
    // User currency will default to 'USD' or be managed by a future backend.
  }, []);

  // Load transaction data
  useEffect(() => {
    const loadTransactions = () => {
      const mockTransactions = [
        {
          id: 'TXN-001',
          type: 'Income',
          category: 'Farm Sale',
          description: 'Sale of wheat to John Smith',
          amount: 2160,
          date: '2024-01-25',
          status: 'Completed',
          paymentMethod: 'Bank Transfer',
          reference: 'ORD-001',
          buyer: 'John Smith',
          farmName: 'Green Valley Farm'
        },
        {
          id: 'TXN-002',
          type: 'Expense',
          category: 'Seeds & Fertilizer',
          description: 'Purchase of organic fertilizer',
          amount: 900,
          date: '2024-01-20',
          status: 'Completed',
          paymentMethod: 'Cash',
          reference: 'INV-2024-001',
          supplier: 'AgriSupply Co.',
          farmName: 'Sunrise Orchards'
        },
        {
          id: 'TXN-003',
          type: 'Income',
          category: 'Farm Sale',
          description: 'Sale of rice to Michael Davis',
          amount: 2880,
          date: '2024-01-28',
          status: 'Completed',
          paymentMethod: 'Online Payment',
          reference: 'ORD-003',
          buyer: 'Michael Davis',
          farmName: 'Golden Fields'
        },
        {
          id: 'TXN-004',
          type: 'Expense',
          category: 'Equipment',
          description: 'Irrigation system maintenance',
          amount: 540,
          date: '2024-01-22',
          status: 'Completed',
          paymentMethod: 'Bank Transfer',
          reference: 'SRV-2024-005',
          supplier: 'IrriTech Services',
          farmName: 'Green Valley Farm'
        },
        {
          id: 'TXN-005',
          type: 'Income',
          category: 'Farm Sale',
          description: 'Sale of mango to Sarah Johnson',
          amount: 2160,
          date: '2024-01-30',
          status: 'Pending',
          paymentMethod: 'Bank Transfer',
          reference: 'ORD-002',
          buyer: 'Sarah Johnson',
          farmName: 'Sunrise Orchards'
        },
        {
          id: 'TXN-006',
          type: 'Expense',
          category: 'Labor',
          description: 'Seasonal workers payment',
          amount: 1260,
          date: '2024-01-15',
          status: 'Completed',
          paymentMethod: 'Cash',
          reference: 'PAY-2024-001',
          supplier: 'Farm Workers',
          farmName: 'Multiple Farms'
        },
        {
          id: 'TXN-007',
          type: 'Expense',
          category: 'Utilities',
          description: 'Electricity bill for farm operations',
          amount: 288,
          date: '2024-01-10',
          status: 'Completed',
          paymentMethod: 'Online Payment',
          reference: 'ELEC-2024-001',
          supplier: 'Power Company',
          farmName: 'All Farms'
        },
        {
          id: 'TXN-008',
          type: 'Income',
          category: 'Rental Income',
          description: 'Land rental from tenant farmer',
          amount: 1620,
          date: '2024-01-05',
          status: 'Completed',
          paymentMethod: 'Bank Transfer',
          reference: 'RENT-2024-001',
          buyer: 'Local Farmer',
          farmName: 'Organic Paradise'
        }
      ];
      
      setTransactions(mockTransactions);
    };
    
    loadTransactions();
  }, []);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Income': return <ArrowUpward />;
      case 'Expense': return <ArrowDownward />;
      default: return <SwapHoriz />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'Income': return '#4caf50';
      case 'Expense': return '#f44336';
      default: return '#2196f3';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Failed': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    const symbol = currencySymbols[userCurrency] || '₨';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filterTransactionsByType = (type) => {
    if (type === 'all') return transactions;
    return transactions.filter(transaction => transaction.type.toLowerCase() === type.toLowerCase());
  };

  const getFilteredTransactions = () => {
    let filtered;
    switch (tabValue) {
      case 0: filtered = transactions; break;
      case 1: filtered = filterTransactionsByType('income'); break;
      case 2: filtered = filterTransactionsByType('expense'); break;
      default: filtered = transactions;
    }
    
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFinancialSummary = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'Income' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'Expense' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = totalIncome - totalExpenses;
    const pendingAmount = transactions
      .filter(t => t.status === 'Pending')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { totalIncome, totalExpenses, netProfit, pendingAmount };
  };

  const summary = getFinancialSummary();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      p: 3
    }}>
      <Box sx={{ 
        maxWidth: '1400px', 
        mx: 'auto',
        mb: 4
      }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Transaction History
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem' }}>
            Track your farm income, expenses, and financial transactions
          </Typography>
        </Box>

        {/* Financial Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 3, 
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <Avatar sx={{ 
                  bgcolor: '#dcfce7', 
                  color: '#059669',
                  width: 48,
                  height: 48,
                  mr: 2
                }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 0.5 }}>
                    {formatCurrency(summary.totalIncome)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Total Income
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 3, 
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <Avatar sx={{ 
                  bgcolor: '#fee2e2', 
                  color: '#dc2626',
                  width: 48,
                  height: 48,
                  mr: 2
                }}>
                  <TrendingDown />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626', mb: 0.5 }}>
                    {formatCurrency(summary.totalExpenses)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Total Expenses
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 3, 
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <Avatar sx={{ 
                  bgcolor: summary.netProfit >= 0 ? '#dcfce7' : '#fee2e2', 
                  color: summary.netProfit >= 0 ? '#059669' : '#dc2626',
                  width: 48,
                  height: 48,
                  mr: 2
                }}>
                  <MonetizationOn />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: summary.netProfit >= 0 ? '#059669' : '#dc2626',
                      mb: 0.5
                    }}
                  >
                    {formatCurrency(summary.netProfit)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Net Profit
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 3, 
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <Avatar sx={{ 
                  bgcolor: '#fef3c7', 
                  color: '#f59e0b',
                  width: 48,
                  height: 48,
                  mr: 2
                }}>
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5 }}>
                    {formatCurrency(summary.pendingAmount)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Pending Amount
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Transaction Table */}
        <Paper sx={{ 
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Transaction Details
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderColor: '#e2e8f0',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#059669',
                      color: '#059669'
                    }
                  }}
                >
                  Export
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Receipt />}
                  size="small"
                  sx={{ 
                    textTransform: 'none',
                    backgroundColor: '#059669',
                    '&:hover': {
                      backgroundColor: '#047857'
                    }
                  }}
                >
                  Add Transaction
                </Button>
              </Stack>
            </Box>
            
            <TextField
              placeholder="Search transactions..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                width: 300,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#059669',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#059669',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ borderBottom: '1px solid #e2e8f0' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  color: '#64748b',
                  '&.Mui-selected': {
                    color: '#059669',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#059669',
                },
              }}
            >
              <Tab label="All Transactions" />
              <Tab label="Income" />
              <Tab label="Expenses" />
            </Tabs>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Transaction ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Payment Method</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredTransactions().map((transaction) => (
                  <TableRow key={transaction.id} hover sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: transaction.type === 'Income' ? '#dcfce7' : '#fee2e2',
                            color: transaction.type === 'Income' ? '#059669' : '#dc2626',
                            width: 32,
                            height: 32
                          }}
                        >
                          {getTransactionIcon(transaction.type)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                          {transaction.id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {new Date(transaction.date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                          {transaction.description}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {transaction.farmName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.category} 
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: '#e2e8f0',
                          color: '#64748b',
                          backgroundColor: '#f8fafc'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: transaction.type === 'Income' ? '#059669' : '#dc2626'
                        }}
                      >
                        {transaction.type === 'Expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.status} 
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {transaction.paymentMethod}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            color: '#64748b',
                            '&:hover': {
                              color: '#059669',
                              backgroundColor: '#f0fdf4'
                            }
                          }}
                        >
                          <Assessment />
                        </IconButton>
                        <IconButton 
                          size="small"
                          sx={{ 
                            color: '#64748b',
                            '&:hover': {
                              color: '#059669',
                              backgroundColor: '#f0fdf4'
                            }
                          }}
                        >
                          <Receipt />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {getFilteredTransactions().length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Receipt sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                No transactions found
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {searchQuery ? 'Try adjusting your search criteria.' : 'Start by adding your first transaction.'}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Transaction;