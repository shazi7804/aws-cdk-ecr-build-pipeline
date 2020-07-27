#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

const env = { region: app.node.tryGetContext('region') || process.env.CDK_INTEG_REGION || process.env.CDK_DEFAULT_REGION };

new PipelineStack(app, 'CdkEcrPipelineStack', {
    env: env,
    ecr_repo: app.node.tryGetContext('ecr_repo'),
    codecommit_repo: app.node.tryGetContext('codecommit_repo'),
    codecommit_branch: app.node.tryGetContext('codecommit_branch'),
    codebuild_project: app.node.tryGetContext('codebuild_project'),
    codepipeline_name: app.node.tryGetContext('codepipeline_name'),
    notifications_email: app.node.tryGetContext('notifications_email')
});
app.synth();