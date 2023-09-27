import * as React from 'react'
import IconButton from '@mui/joy/IconButton'
import List from '@mui/joy/List'
import ListSubheader from '@mui/joy/ListSubheader'
import ListItem from '@mui/joy/ListItem'
import ListItemButton from '@mui/joy/ListItemButton'
import ListItemContent from '@mui/joy/ListItemContent'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { NavLink } from 'react-router-dom'
import { IS_PUBLIC } from '../config'

export const Sidebar = () => (
  <List size="sm" sx={{ '--ListItem-radius': '8px', '--List-gap': '4px' }}>
    <ListItem nested>
      <ListSubheader>
        Browse
        <IconButton
          size="sm"
          variant="plain"
          color="primary"
          sx={{ '--IconButton-size': '24px', ml: 'auto' }}
        >
          <KeyboardArrowDownRoundedIcon fontSize="small" color="primary" />
        </IconButton>
      </ListSubheader>
      <List
        aria-labelledby="nav-list-browse"
        sx={{
          '& .JoyListItemButton-root': { p: '8px' },
        }}
      >
        {[
          { path: 'data-request', label: 'Data Requests', hidePublic: false },
          {
            path: 'one-time-data-request',
            label: 'One Time Data Requests',
            hidePublic: false,
          },
          { path: 'create-token', label: 'Create Token', hidePublic: true },
          { path: 'pools', label: 'Pools', hidePublic: true },
          {
            path: 'standard-metadata',
            label: 'Standard Metadata',
            hidePublic: true,
          },
          {
            path: 'send-transaction',
            label: 'Send Transaction',
            hidePublic: true,
          },
          {
            path: 'rola',
            label: 'ROLA',
            hidePublic: true,
          },
          {
            path: 'integration-tests',
            label: 'Integration Tests',
            hidePublic: true,
          },

          { path: 'settings', label: 'Settings', hidePublic: false },
        ]
          .filter((item) => !item.hidePublic || !IS_PUBLIC)
          .map((item) => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <ListItem>
                  <ListItemButton
                    variant={isActive ? 'soft' : 'plain'}
                    color="primary"
                  >
                    <ListItemContent>{item.label}</ListItemContent>
                  </ListItemButton>
                </ListItem>
              )}
            </NavLink>
          ))}
      </List>
    </ListItem>
  </List>
)
