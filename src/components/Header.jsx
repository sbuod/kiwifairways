import React from 'react';
import Image from 'next/image';
import { Center, Tooltip } from '@mantine/core';
import classes from '../styles/header.module.css';

export const Header = () => {
  return (
    <Center component="header" className={classes.header}>
      <Tooltip label="Your guide to golf in beautiful Aotearoa New Zealand" withArrow>
        <Image
          src="/images/logo.png"
          alt="Kiwi Fairways"
          width={160}
          height={160}
          priority
          className={classes.logo}
        />
      </Tooltip>
    </Center>
  );
};
