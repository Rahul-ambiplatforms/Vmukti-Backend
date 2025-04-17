import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, Box, Spinner, Center } from '@chakra-ui/react';
import './App.css'
import LoginDash from './pages/LoginDash'
import theme from './components/theme';
import ErrorBoundary from './components/ui/ErrorBoundary';

function App() {

  return (
    <>
      <ChakraProvider theme={theme}>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path='/' element={<LoginDash />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </ChakraProvider>
    </>
  )
}

export default App
