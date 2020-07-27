import cdk = require("@aws-cdk/core");
import codecommit = require("@aws-cdk/aws-codecommit");
import codebuild = require("@aws-cdk/aws-codebuild");
import codepipeline = require("@aws-cdk/aws-codepipeline");
import codepipeline_actions = require("@aws-cdk/aws-codepipeline-actions");
import iam = require("@aws-cdk/aws-iam");
import ecr = require("@aws-cdk/aws-ecr");
import sns = require("@aws-cdk/aws-sns");
import sns_subscriptions = require("@aws-cdk/aws-sns-subscriptions");
import targets = require("@aws-cdk/aws-events-targets");
import { MakeDirectoryOptions } from "fs";

export interface PipelineStackProps extends cdk.StackProps {
  readonly ecr_repo: string;
  readonly codecommit_repo: string;
  readonly codecommit_branch: string;
  readonly codebuild_project: string;
  readonly codepipeline_name: string;
  readonly notifications_email: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    /** 
     * ECR: create repository
    **/
    const ecrRepository = new ecr.Repository(this, "DemoImageRepo", {
      repositoryName: props.ecr_repo
    });

    /** 
     * CodeCommit: create repository
    **/ 
    const codecommitRepository = new codecommit.Repository(this, "DemoSourceRepo", {
      repositoryName: props.codecommit_repo
    });


    /**
     * CodeBuild: 
     * 1. create codebuild project
     * 2. create policy of ECR and Codecommit
    **/ 
    const codebuildProject = new codebuild.PipelineProject(this, "DemoBuild", {
      projectName: props.codebuild_project,
      environment: {
        computeType: codebuild.ComputeType.SMALL,
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true,
        environmentVariables: {
          AWS_ACCOUNT_ID: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: cdk.Aws.ACCOUNT_ID
          },
          AWS_DEFAULT_REGION: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: cdk.Aws.REGION
          }
        }
      }
    });
    // codebuild policy of codecommit pull source code.
    const codeBuildPolicyOfcodeCommit = new iam.PolicyStatement();
    codeBuildPolicyOfcodeCommit.addResources(codecommitRepository.repositoryArn)
    codeBuildPolicyOfcodeCommit.addActions(
      "codecommit:ListBranches",
      "codecommit:ListRepositories",
      "codecommit:BatchGetRepositories",
      "codecommit:GitPull"
    );
    codebuildProject.addToRolePolicy(
      codeBuildPolicyOfcodeCommit,
    );
    // codebuild policy of ecr build
    const codeBuildPolicyEcr = new iam.PolicyStatement();
    codeBuildPolicyEcr.addAllResources()
    codeBuildPolicyEcr.addActions(
      "ecr:GetAuthorizationToken",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage"
    )
    codebuildProject.addToRolePolicy(codeBuildPolicyEcr);


    /**
     * CodePipeline: 
     * 1. create codebuild project
     * 2. create policy of ECR and Codecommit
    **/

    // trigger of `CodeCommitTrigger.POLL`
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: "Source-CodeCommit",
      branch: props.codecommit_branch,
      trigger: codepipeline_actions.CodeCommitTrigger.POLL,
      repository: codecommitRepository,
      output: sourceOutput
    });

    // when codecommit input then action of codebuild
    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "Build",
      input: sourceOutput,
      outputs: [
        buildOutput
      ],
      project: codebuildProject
    });

    // create pipeline, and then add both codecommit and codebuild  
    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: props.codepipeline_name
    });
    pipeline.addStage({
      stageName: "Source",
      actions: [sourceAction]
    });
    pipeline.addStage({
      stageName: "Build",
      actions: [buildAction]
    });

    /**
     * SNS: Monitor pipeline state change then notifiy
    **/
    if ( props.notifications_email ) {
      const pipelineSnsTopic = new sns.Topic(this, 'DemoPipelineStageChange');
      pipelineSnsTopic.addSubscription(new sns_subscriptions.EmailSubscription(props.notifications_email))
      pipeline.onStateChange("PipelineStateChange", {
        target: new targets.SnsTopic(pipelineSnsTopic), 
        description: 'Listen for codepipeline change events',
        eventPattern: {
          detail: {
            state: [ 'FAILED', 'SUCCEEDED', 'STOPPED' ]
          }
        }
      });
    }

    /**
     * Output: 
     * - CodeCommit clone path of HTTP and SSH
     * - ECR Repository URI
    **/
    new cdk.CfnOutput(this, 'CodeCommitCloneUrlHttp', {
      description: 'CodeCommit Repo CloneUrl HTTP',
      value: codecommitRepository.repositoryCloneUrlHttp
    });

    new cdk.CfnOutput(this, 'CodeCommitCloneUrlSsh', {
      description: 'CodeCommit Repo CloneUrl SSH',
      value: codecommitRepository.repositoryCloneUrlSsh
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      description: 'ECR Repository URI',
      value: ecrRepository.repositoryUri
    });
  }
}
