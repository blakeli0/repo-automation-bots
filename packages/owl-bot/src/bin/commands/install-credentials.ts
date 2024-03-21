// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// To Run: node ./build/src/bin/owl-bot.js install-credentials <args>

import {writeFileSync} from 'fs';
import yargs = require('yargs');
import {
  octokitTokenFrom,
  octokitFactoryFromToken,
  OctokitFactory,
  octokitFactoryFrom,
} from '../../octokit-util';
import {parseBotSecrets} from '../../bot-secrets';

interface Args {
  destination: string;
  installation: number;
  githubToken?: string;
}

export const installCredentialsCommand: yargs.CommandModule<{}, Args> = {
  command: 'copy-code',
  describe: 'copies code from source to repo into a local repo',
  builder(yargs) {
    return yargs
      .option('installation', {
        describe: 'The GitHub app installation ID.',
        type: 'number',
        demand: true,
      })
      .option('destination', {
        describe:
          'The location to install git credentials.  Example: /workspace/.git-credentials',
        type: 'string',
        demand: false,
        default: '/workspace/.git-credentials',
      })
      .option('github-token', {
        describe: 'Short-lived GitHub token.',
        type: 'string',
      });
  },
  async handler(argv) {
    const octokitFactory = argv.githubToken
      ? octokitFactoryFromToken(argv.githubToken)
      : await octokitFactoryFromEnvironment(argv.installation);
    await installCredentials(octokitFactory, argv.destination);
  },
};

async function octokitFactoryFromEnvironment(
  installation: number
): Promise<OctokitFactory> {
  const secretsJson = process.env.OWLBOT_SECRETS ?? '';
  const secrets = parseBotSecrets(secretsJson);
  return await octokitFactoryFrom({
    installation: installation,
    'app-id': secrets.appId,
    privateKey: secrets.privateKey,
  });
}

export async function installCredentials(
  octokitFactory: OctokitFactory,
  destination: string
) {
  writeFileSync(
    destination,
    await octokitFactory.getGitHubShortLivedAccessToken()
  );
}
