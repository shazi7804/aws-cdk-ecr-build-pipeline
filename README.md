# AWS CDK ECR build pipeline of AWS CodeCommit, CodeBuild and CodePipeline

This repository is a CI/CD pipeline of ECR image build.

## Change your own

- Change repo, branch and more name.

```
# cdk.context.json
{
    "ecr_repo": "...",
    "codecommit_repo": "...",
    "codecommit_branch": "master",
    "codebuild_project": "...",
    "codepipeline_name": "...",
}
```

- If your want notifications email when CodePipeline stage changes.

```
# add email of `notifications_email` in cdk.context.json
{
    "notifications_email": "<your_own_email>"
}
```

## Deploy Stack

```
npm install
cdk diff
cdk deploy
```

- Deploy with different AWS_PROFILE

```
cdk --profile another diff
```

- Deploy into a different AWS region

```
AWS_REGION=us-west-1 cdk diff
```

## Build container image to AWS ECR

A sample [repo](repo) that demonstrates the build pipeline of ECR.

## Author

@shazi7804

