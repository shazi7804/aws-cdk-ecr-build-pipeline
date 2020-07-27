# AWS CDK ECR build pipeline of AWS CodeCommit, CodeBuild and CodePipeline

This repository is a CI/CD pipeline of ECR image build.

## Change your own

If your want notifications email when CodePipeline stage changes.

```
# add email of `notifications_email` in cdk.context.json
{
    "notifications_email": "example@gmail.com"
}
```

## Deploy Stack

```
cdk diff
cdk deploy
```

## Deploy with different AWS_PROFILE

```
cdk --profile another diff
```

## Deploy into a different AWS region

```
AWS_REGION=us-west-1 cdk diff
```