import * as React from 'react'
import IconButton from '@mui/joy/IconButton'
import List from '@mui/joy/List'
import ListSubheader from '@mui/joy/ListSubheader'
import ListItem from '@mui/joy/ListItem'
import ListItemButton from '@mui/joy/ListItemButton'
import ListItemContent from '@mui/joy/ListItemContent'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { NavLink } from 'react-router-dom'

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
          { path: 'data-request', label: 'Data Requests' },
          { path: 'create-token', label: 'Create Token' },
          {
            path: 'send-transaction',
            label: 'Send Transaction',
          },
          {
            path: 'rola',
            label: 'ROLA',
          },
          {
            path: 'integration-tests',
            label: 'Integration Tests',
          },

          { path: 'settings', label: 'Settings' },
        ].map((item) => (
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
