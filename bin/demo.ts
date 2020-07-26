#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ModelPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new ModelPipelineStack(app, 'CdkSagemakerModelPipelineStack', { env: { region: 'us-east-1' } });
