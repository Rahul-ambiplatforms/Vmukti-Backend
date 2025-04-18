import {
    Box,
    Button,
    Flex,
    Image,
    Input,
    Text,
    Checkbox,
    InputGroup,
    InputRightElement,
    useBreakpointValue,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

const LoginDash = () => {
    const [show, setShow] = useState(false);
    const { register, handleSubmit } = useForm();

    const onSubmit = (data) => {
        console.log("Form Data:", data);
    };

    return (
        <Flex
            height="100vh"
            align="center"
            justify="center"
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    bg="white"
                    borderRadius="24px"
                    mx="auto"
                    mt={10}
                    px={{ base: 4, md: 8 }}
                    py={{ base: 8, md: 12 }}
                    maxWidth="1565px"
                    boxShadow="0px 4px 20px rgba(0, 0, 0, 0.1)"
                    justifyContent="space-evenly"
                    gap={8}
                >
                    <Flex
                        justifyContent="center"
                        alignItems="center"
                        flex="1"
                        textAlign="center"
                    >
                        <Text
                            fontSize={{ base: '32px', md: '48px' }}
                            fontWeight="600"
                            color="#3F77A5"
                        >
                            VMUTKI BLOGS
                        </Text>
                    </Flex>

                    <Flex
                        direction="column"
                        justifyContent="space-between"
                        flex="1"
                        gap={6}
                    >
                        <Box>
                            <Text fontWeight="600" fontSize={{ base: '24px', md: '36px' }}>
                                Log in
                            </Text>
                            <Text fontWeight="400" fontSize="16px" mt={2}>
                                Welcome back! Please enter your details and get access to your digital vision.
                            </Text>
                        </Box>

                        <Flex direction="column" gap={2}>
                            <Text>Email</Text>
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                {...register('email')}
                            />
                        </Flex>

                        <Flex direction="column" gap={2}>
                            <Text>Password</Text>
                            <InputGroup size="md">
                                <Input
                                    pr="4.5rem"
                                    type={show ? 'text' : 'password'}
                                    placeholder="Enter password"
                                    {...register('password')}
                                />
                                <InputRightElement width="3rem">
                                    <Button
                                        h="1.75rem"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShow(!show)}
                                    >
                                        {show ? <ViewOffIcon /> : <ViewIcon />}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </Flex>

                        <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap">
                            <Checkbox colorScheme="gray" {...register('remember')}>
                                <Text fontSize="14px">Remember for 30 days</Text>
                            </Checkbox>
                            <Link>
                                <Text
                                    _hover={{ textDecoration: 'underline' }}
                                    fontWeight="600"
                                    fontSize="14px"
                                    color="#3F77A5"
                                    mt={{ base: 2, md: 0 }}
                                >
                                    Forgot password
                                </Text>
                            </Link>
                        </Flex>

                        <Button
                            type="submit"
                            width="100%"
                            bg="#3F77A5"
                            color="white"
                            fontSize="16px"
                            fontWeight="600"
                            borderRadius="8px"
                            _hover={{ background: "#35668E" }}
                        >
                            Sign in
                        </Button>
                    </Flex>
                </Flex>
            </form>
        </Flex>
    );
};

export default LoginDash;
