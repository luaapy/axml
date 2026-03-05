const discord = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { EventEmitter } = require('events');
const config = require('./config');

module.exports = {
    ...discord,
    fs, path, express, EventEmitter, config
};
