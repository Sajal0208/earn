import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { type Bounty } from '@/features/listings';
import { type SubmissionWithUser } from '@/interface/submission';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  totalWinners: number;
  totalPaymentsMade: number;
  bounty: Bounty | null;
  submissions: SubmissionWithUser[];
}

export function PublishResults({
  isOpen,
  onClose,
  totalWinners,
  totalPaymentsMade,
  bounty,
  // submissions,
}: Props) {
  const [isPublishingResults, setIsPublishingResults] = useState(false);
  const [isWinnersAnnounced, setIsWinnersAnnounced] = useState(
    bounty?.isWinnersAnnounced,
  );
  const isDeadlinePassed = dayjs().isAfter(bounty?.deadline);

  const rewards = Object.keys(bounty?.rewards || {});
  // const winnerBannerRef = useRef<HTMLDivElement>(null);

  let alertType:
    | 'loading'
    | 'info'
    | 'error'
    | 'warning'
    | 'success'
    | undefined = 'warning';
  let alertTitle = '';
  let alertDescription = '';
  if (rewards?.length && totalWinners !== rewards?.length) {
    const remainingWinners = (rewards?.length || 0) - totalWinners;
    alertType = 'error';
    alertTitle = 'Select All Winners!';
    alertDescription = `You still have to select ${remainingWinners} more ${
      remainingWinners === 1 ? 'winner' : 'winners'
    } before you can publish the results publicly.`;
  } else if (rewards?.length && totalPaymentsMade !== rewards?.length) {
    const remainingPayments = (rewards?.length || 0) - totalPaymentsMade;
    alertType = 'warning';
    alertTitle = 'Pay All Winners!';
    alertDescription = `Don't forget to pay your winners after publishing results. You have to pay to ${remainingPayments} ${
      remainingPayments === 1 ? 'winner' : 'winners'
    }.`;
  }

  // const saveBannerUrl = async (): Promise<string> => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       if (!winnerBannerRef.current) {
  //         throw new Error('no banner ref');
  //       }
  //       console.log('oooo no banner url');
  //       const canvas = await html2canvas(winnerBannerRef.current, {
  //         useCORS: true,
  //         width: 1200,
  //         height: 675,
  //         x: 0,
  //         y: 0,
  //         onclone: (el) => {
  //           const elementsWithShiftedDownwardText =
  //             el.querySelectorAll<HTMLElement>('.shifted-text');
  //           elementsWithShiftedDownwardText.forEach((element) => {
  //             element.style.transform = 'translateY(-30%)';
  //           });
  //         },
  //       });

  //       const mimeType = 'image/png';
  //       if (!bounty?.id || !bounty?.slug) throw new Error('no id or slug');
  //       const fileName = `${bounty.id}-winner-banner`;

  //       const blob = await getBlobFromCanvas(canvas, mimeType);

  //       if (!blob) throw new Error('no blob');
  //       const file = new File([blob], fileName, { type: mimeType });

  //       const url = await uploadToCloudinary(file);

  //       await axios.put(`/api/bounties/${bounty.slug}/setWinnerBanner`, {
  //         image: url,
  //       });

  //       resolve(url);
  //     } catch {
  //       reject('Some Error Occured');
  //     }
  //   });
  // };

  const publishResults = async () => {
    if (!bounty?.id) return;
    setIsPublishingResults(true);
    try {
      await axios.post(`/api/bounties/announce/${bounty?.id}/`);
      // await saveBannerUrl();
      setIsWinnersAnnounced(true);
      setIsPublishingResults(false);
    } catch (e) {
      setIsPublishingResults(false);
    }
  };

  useEffect(() => {
    if (!isWinnersAnnounced || bounty?.isWinnersAnnounced) return;
    const timer = setTimeout(() => {
      window.location.reload();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isWinnersAnnounced]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Publish Results</ModalHeader>
        <ModalCloseButton />
        {/* {bounty && (
          <Box pos="fixed" zIndex={-99999} top={'-300%'} right={'-300%'}>
            <WinnerBanner
              ref={winnerBannerRef}
              submissions={submissions}
              bounty={bounty}
            />
          </Box>
        )} */}
        <ModalBody>
          {isWinnersAnnounced && (
            <Alert
              alignItems="center"
              justifyContent="center"
              flexDir="column"
              py={4}
              textAlign="center"
              status="success"
              variant="subtle"
            >
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Results Announced Successfully!
              </AlertTitle>
              <AlertDescription maxW="sm">
                The results have been announced publicly. Everyone can view the
                results on the Bounty&apos;s page.
                <br />
                <br />
                {!bounty?.isWinnersAnnounced && (
                  <Text as="span" color="brand.slate.500" fontSize="sm">
                    Refreshing...
                  </Text>
                )}
              </AlertDescription>
            </Alert>
          )}
          {!isWinnersAnnounced &&
            rewards?.length &&
            totalWinners === rewards?.length &&
            alertType !== 'error' && (
              <Text mb={4}>
                Publishing the results of this listing will make the results
                public for everyone to see!
                <br />
                YOU CAN&apos;T GO BACK ONCE YOU PUBLISH THE RESULTS!
              </Text>
            )}
          {!isWinnersAnnounced && alertTitle && alertDescription && (
            <Alert status={alertType}>
              <AlertIcon boxSize={8} />
              <Box>
                <AlertTitle>{alertTitle}</AlertTitle>
                <AlertDescription>{alertDescription}</AlertDescription>
              </Box>
            </Alert>
          )}
          {bounty?.applicationType !== 'rolling' &&
            !isWinnersAnnounced &&
            rewards?.length &&
            totalWinners === rewards?.length &&
            !isDeadlinePassed && (
              <Alert mt={4} status="error">
                <AlertIcon boxSize={8} />
                <Box>
                  <AlertTitle>Listing still in progress!</AlertTitle>
                  <AlertDescription>
                    If you publish the results before the deadline, the listing
                    will close since the winner(s) will have been announced.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
        </ModalBody>
        <ModalFooter>
          {!isWinnersAnnounced && (
            <>
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
              <Button
                ml={4}
                isDisabled={
                  (rewards?.length && totalWinners !== rewards?.length) ||
                  alertType === 'error'
                }
                isLoading={isPublishingResults}
                loadingText={'Publishing...'}
                onClick={() => publishResults()}
                variant="solid"
              >
                Publish
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
