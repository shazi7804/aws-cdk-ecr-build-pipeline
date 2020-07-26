import cdk = require("@aws-cdk/core");
import codecommit = require("@aws-cdk/aws-codecommit");
import codebuild = require("@aws-cdk/aws-codebuild");
import codepipeline = require("@aws-cdk/aws-codepipeline");
import codepipeline_actions = require("@aws-cdk/aws-codepipeline-actions");
import iam = require("@aws-cdk/aws-iam");
import ecr = require("@aws-cdk/aws-ecr");
import s3 = require("@aws-cdk/aws-s3");

const ecr_repo = 'model-image-repo'
const codecommit_repo = 'model-repo'
const codecommit_branch = 'master';
const codebuild_project = 'model-build'
const codepipeline_name = 'model-pipeline'


export class ModelPipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /** 
     * ecr: create repository
    **/
    const ecrRepository = new ecr.Repository(this, "ModelImageRepo", {
      repositoryName: ecr_repo
    }); 

    /** 
     * codecommit: create repository
    **/ 
    const codecommitRepository = new codecommit.Repository(this, "ModelSourceRepo", {
      repositoryName: codecommit_repo
    });


    /**
     * codebuild: 
     * 1. create codebuild project
     * 2. create iam.PolicyStatement
    **/ 
    const codebuildProject = new codebuild.PipelineProject(this, "ModelBuild", {
      projectName: codebuild_project,
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

    const codeBuildPolicy = new iam.PolicyStatement();
    codeBuildPolicy.addResources(codecommitRepository.repositoryArn)
    codeBuildPolicy.addActions(
        "codecommit:ListBranches",
        "codecommit:ListRepositories",
        "codecommit:BatchGetRepositories",
        "codecommit:GitPull"
      )
    codebuildProject.addToRolePolicy(
      codeBuildPolicy
    );

    // codepipeline to pull in codecommit repo as the pipeline source
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: "Source-CodeCommit",
      branch: codecommit_branch,
      trigger: codepipeline_actions.CodeCommitTrigger.POLL,
      repository: codecommitRepository,
      output: sourceOutput
    });

    // CodePipeline with codebuild
    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "Build",
      input: sourceOutput,
      outputs: [
        buildOutput
      ],
      project: codebuildProject
    });

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: codepipeline_name
    });
    pipeline.addStage({
      stageName: "Source",
      actions: [sourceAction]
    });
    pipeline.addStage({
      stageName: "Build",
      actions: [buildAction]
    });
    
    new cdk.CfnOutput(this, 'ModelRepositoryCloneUrlHttp', {
      description: 'Model Repository CloneUrl HTTP',
      value: codecommitRepository.repositoryCloneUrlHttp
    });

    new cdk.CfnOutput(this, 'ModelRepositoryCloneUrlSsh', {
      description: 'Model Repository CloneUrl SSH',
      value: codecommitRepository.repositoryCloneUrlSsh
    });

    new cdk.CfnOutput(this, 'ModelImageRepositoryUri', {
      description: 'Model Image Repository URI',
      value: ecrRepository.repositoryUri
    });
  }
}
