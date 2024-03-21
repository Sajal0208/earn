import { Box, Button, Center, Flex, Image, Text } from '@chakra-ui/react';
import axios from 'axios';
import Avatar from 'boring-avatars';
import html2canvas from 'html2canvas';
import NextLink from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { SubmissionWithUser } from '@/interface/submission';
import { openExternalLinkInNewTab } from '@/utils/linkInNewTab';
import { sortRank } from '@/utils/rank';
import { tweetEmbedLink, tweetTemplate } from '@/utils/tweetTemplate';
import { uploadToCloudinary } from '@/utils/upload';

import type { Bounty, Rewards } from '../../types';
import WinnerBanner from './WinnerBanner';

interface Props {
  bounty: Bounty;
}

export function ListingWinners({ bounty }: Props) {
  const [isListingLoading, setIsListingLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  const [loadingBanner, setLoadingBanner] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(bounty.winnerBannerUrl);

  const winnerBannerRef = useRef<HTMLDivElement>(null);

  const isProject = bounty?.type === 'project';

  const getSubmissions = async (id?: string) => {
    setIsListingLoading(true);
    try {
      const submissionsDetails = await axios.get(
        `/api/submission/${id || bounty?.id}/winners/`,
      );
      const { data } = submissionsDetails;
      const winners = sortRank(
        data.map(
          (submission: SubmissionWithUser) => submission.winnerPosition || '',
        ),
      );
      const sortedSubmissions = winners.map((position) =>
        data.find((d: SubmissionWithUser) => d.winnerPosition === position),
      );
      setSubmissions(sortedSubmissions);
      setIsListingLoading(false);
    } catch (e) {
      setIsListingLoading(false);
    }
  };

  useEffect(() => {
    getSubmissions();
  }, []);

  const onShareClick = useCallback(async () => {
    setLoadingBanner(true);
    if (bannerUrl) {
      let path = window.location.href.split('?')[0];
      if (!path) return;

      path += 'winner';

      const tweetLink = tweetEmbedLink(
        tweetTemplate(
          bounty.sponsor?.twitter ?? bounty.sponsor?.name ?? '',
          !!bounty.sponsor?.twitter,
          path,
        ),
      );

      openExternalLinkInNewTab(tweetLink);

      setLoadingBanner(false);
      return;
    }
    if (!winnerBannerRef.current) return;
    const canvas = await html2canvas(winnerBannerRef.current, {
      useCORS: true,
      width: 1200,
      height: 675,
      x: 0,
      y: 0,
      onclone: (el) => {
        const elementsWithShiftedDownwardText =
          el.querySelectorAll<HTMLElement>('.shifted-text');
        elementsWithShiftedDownwardText.forEach((element) => {
          element.style.transform = 'translateY(-30%)';
        });
      },
    });
    // const data = canvas.toDataURL('image/jpg')
    canvas.toBlob(async function (blob) {
      if (!bounty.id || !bounty.slug) return;
      const fileName = `${bounty.id}-winner-banner`;
      const mimeType = 'image/png';

      if (!blob) return;
      const file = new File([blob], fileName, { type: mimeType });

      const url = await uploadToCloudinary(file);

      await axios.put(`/api/bounties/${bounty.slug}/setWinnerBanner`, {
        image: url,
      });

      setBannerUrl(url);

      let path = window.location.href.split('?')[0];
      if (!path) return;

      path += 'winner';

      const tweetLink = tweetEmbedLink(
        tweetTemplate(
          bounty.sponsor?.twitter ?? bounty.sponsor?.name ?? '',
          !!bounty.sponsor?.twitter,
          path,
        ),
      );

      openExternalLinkInNewTab(tweetLink);

      setLoadingBanner(false);
    }, 'image/png');
  }, [winnerBannerRef]);

  if (isListingLoading || !submissions.length) {
    return null;
  }

  return (
    <Box maxW={'7xl'} mx={'auto'} mt={10}>
      <Text
        mx={3}
        mb={4}
        color="brand.slate.500"
        fontSize="xl"
        fontWeight={600}
      >
        🎉 Winners Announced
      </Text>
      {!bannerUrl && (
        <Box pos="absolute" zIndex={-99999} top={'-200%'} right={'-200%'}>
          <WinnerBanner
            ref={winnerBannerRef}
            bounty={bounty}
            submissions={submissions}
            isProject={isProject}
          />
        </Box>
      )}
      <Box mx={3}>
        <Box
          pos="relative"
          w="full"
          px={10}
          py={6}
          color="white"
          bg="radial-gradient(circle, rgba(159,65,255,1) 25%, rgba(99,102,241,1) 100%);"
          rounded="md"
        >
          <Flex align="center" justify="center" wrap="wrap" gap={10}>
            {submissions.map((submission) => (
              <NextLink
                key={submission.id}
                href={
                  !isProject
                    ? `/listings/${bounty?.type}/${bounty?.slug}/submission/${submission?.id}/`
                    : `/t/${submission?.user?.username}`
                }
                passHref
              >
                <Flex
                  as="a"
                  pos="relative"
                  align="center"
                  justify="center"
                  direction={'column'}
                  cursor="pointer"
                >
                  <Text
                    pos="absolute"
                    top={-2}
                    px={1}
                    color="white"
                    fontSize="xs"
                    fontWeight={700}
                    textAlign="center"
                    textTransform="capitalize"
                    bg="brand.purple"
                    rounded={'full'}
                  >
                    {isProject ? 'Winner' : submission?.winnerPosition}
                  </Text>
                  {submission?.user?.photo ? (
                    <Image
                      boxSize="72px"
                      borderRadius="full"
                      alt={`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                      src={submission?.user?.photo}
                    />
                  ) : (
                    <Avatar
                      name={`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                      colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                      size={72}
                      variant="marble"
                    />
                  )}
                  <Text
                    fontSize="sm"
                    fontWeight={600}
                    textAlign={'center'}
                  >{`${submission?.user?.firstName} ${submission?.user?.lastName}`}</Text>
                  <Text
                    fontSize="xs"
                    fontWeight={300}
                    textAlign="center"
                    opacity={0.6}
                  >
                    {bounty?.token}{' '}
                    {bounty?.rewards &&
                      bounty?.rewards[
                        submission?.winnerPosition as keyof Rewards
                      ]}
                  </Text>
                </Flex>
              </NextLink>
            ))}
          </Flex>
          <Button
            pos="absolute"
            top={5}
            right={5}
            gap={2}
            display="flex"
            color="rgba(0, 0, 0, 0.65)"
            fontSize="14px"
            fontWeight={500}
            bg="white"
            _hover={{ background: 'rgba(255, 255, 255, 0.8)' }}
            _active={{ background: 'rgba(255, 255, 255, 0.5)' }}
            isLoading={loadingBanner}
            onClick={onShareClick}
          >
            Share on
            <Center w="1.2rem">
              <svg
                width="33px"
                height="33px"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M25.0851 3.09375H29.6355L19.6968 14.4504L31.3886 29.9062H22.2363L15.0626 20.5348L6.86421 29.9062H2.30737L12.9357 17.7568L1.72729 3.09375H11.1117L17.5892 11.6596L25.0851 3.09375ZM23.4867 27.1863H26.0068L9.73882 5.67188H7.03179L23.4867 27.1863Z"
                  fill="black"
                />
              </svg>
            </Center>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// <NextLink href={`/listings/${bounty?.type}/${bounty?.slug}/winners/`}>
