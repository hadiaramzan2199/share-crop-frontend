import React, { useState, useEffect } from 'react';
import { Chip, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { AccountBalanceWallet, Add } from '@mui/icons-material';
import { userService } from '../../services/users';

const FarmCoinBalance = ({ user, onBalanceUpdate }) => {
  const [balance, setBalance] = useState(0);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(100);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await userService.getBalance();
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    try {
      await userService.deposit({ amount: depositAmount });
      await fetchBalance();
      setDepositDialogOpen(false);
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
    } catch (error) {
      console.error('Error depositing:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <Chip
        icon={<AccountBalanceWallet />}
        label={`${balance.toLocaleString()} Farm Coins`}
        variant="outlined"
        onClick={() => setDepositDialogOpen(true)}
        sx={{
          cursor: 'pointer',
          borderColor: 'warning.main',
          color: 'warning.dark',
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: 'warning.light',
            color: 'white',
          },
        }}
      />

      <Dialog open={depositDialogOpen} onClose={() => setDepositDialogOpen(false)}>
        <DialogTitle>
          <Add sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Add Farm Coins
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Balance: {balance.toLocaleString()} coins
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            label="Amount to Deposit"
            value={depositAmount}
            onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
            sx={{ mt: 2 }}
            inputProps={{ min: 10, max: 10000 }}
          />
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
            <Typography variant="body2" color="success.dark">
              You'll receive: {depositAmount} Farm Coins
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeposit} 
            variant="contained"
            disabled={loading || depositAmount <= 0}
          >
            {loading ? 'Processing...' : 'Deposit'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FarmCoinBalance;